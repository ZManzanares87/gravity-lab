"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  type InferUITools,
  type UIDataTypes,
  type UIMessage,
} from "ai";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { EXPERIMENTS } from "@/lab/experiments";
import { EXPERIMENT_TITLES } from "@/lab/journey";
import { getLiveState } from "@/lab/liveState";
import type { SceneId } from "@/lab/scenes";
import { useLabStore } from "@/lab/store";
import { buildLabContext } from "../context";
import { describeActions } from "../describeActions";
import { preparableActions } from "../proposal";
import { useTutorDock } from "../dockStore";
import { TUTOR_TOOLS, type ProposeExperimentInput, type ProposeExperimentOutput } from "../tools";

/** Un mensaje enviado por la app, no escrito por la persona: tras cada predicción. */
interface TutorMetadata {
  readonly auto?: { readonly chosen: string; readonly correct: boolean };
}

type TutorMessage = UIMessage<TutorMetadata, UIDataTypes, InferUITools<typeof TUTOR_TOOLS>>;
type ProposalPart = Extract<TutorMessage["parts"][number], { type: "tool-proponerExperimento" }>;

/** Saludo fijo: aparece al instante, no cuesta nada y funciona también sin clave. */
const GREETING: TutorMessage = {
  id: "saludo",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "¡Hola! Vamos a explorar la gravedad juntos. Haz predicciones, experimenta y pregúntame lo que quieras: podemos comprobarlo con un experimento.",
    },
  ],
};

function textOf(message: TutorMessage): string {
  return message.parts.flatMap((part) => (part.type === "text" ? [part.text] : [])).join(" ");
}

/** Aplica una propuesta aceptada con las mismas acciones que usan los controles. */
function applyProposal(input: ProposeExperimentInput): ProposeExperimentOutput {
  const { dispatch, sceneId } = useLabStore.getState();
  // La IA prepara y la persona ejecuta: qué se aplica lo decide preparableActions. Al final,
  // la simulación queda en pausa y en su inicio, esperando a que la persona pulse Play.
  const { apply, refused } = preparableActions(input.actions, sceneId);
  const rejected = [
    ...refused,
    ...apply.flatMap((action) => {
      const result = dispatch(action);
      return result.ok ? [] : [result.reason];
    }),
  ];
  dispatch({ type: "pause" });
  dispatch({ type: "reset" });
  return {
    accepted: true,
    detail:
      rejected.length === 0
        ? "La persona ha aceptado. El experimento está preparado y en pausa: lo verá cuando pulse Play. Su estado actualizado llega en el contexto."
        : `La persona ha aceptado, pero algunas acciones no eran válidas: ${rejected.join(" ")} El resto está preparado y en pausa.`,
  };
}

/** El servidor responde con un código conocido; aquí se traduce a un mensaje útil. */
function errorText(error: Error): string {
  if (error.message.includes("tutor-no-disponible")) {
    return "El tutor no está disponible ahora mismo: falta configurar la clave de la IA. Todo lo demás funciona igual: los experimentos, sus explicaciones y la ley completa.";
  }
  if (error.message.includes("demasiadas-peticiones")) {
    return "Has enviado muchos mensajes seguidos. Prueba de nuevo dentro de un rato.";
  }
  return "No he podido responder. Comprueba la conexión y prueba de nuevo.";
}

export function TutorPanel() {
  const sceneId = useLabStore((state) => state.sceneId);
  const predictions = useLabStore((state) => state.predictions);
  const [input, setInput] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  // Cuántas predicciones se han procesado ya: cada una dispara una sola vez.
  const seen = useRef(predictions.length);

  // El contexto se calcula en el momento de cada envío: siempre es el estado actual.
  const [transport] = useState(
    () =>
      new DefaultChatTransport<TutorMessage>({
        api: "/api/tutor",
        body: () => ({ labContext: buildLabContext(useLabStore.getState(), getLiveState()) }),
      }),
  );

  const { messages, sendMessage, addToolOutput, status, error, regenerate } = useChat<TutorMessage>({
    transport,
    messages: [GREETING],
    // Cuando la persona responde a una propuesta, la conversación sigue sola.
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onFinish: ({ message }) => {
      // Se anuncia la respuesta completa, no cada trocito mientras llega.
      setAnnouncement(textOf(message));
      // Con el panel cerrado, el botón avisa de que hay una respuesta nueva.
      if (!useTutorDock.getState().open) useTutorDock.getState().markUnread();
    },
  });

  const busy = status === "submitted" || status === "streaming";
  const pendingProposal = messages.some((message) =>
    message.parts.some((part) => part.type === "tool-proponerExperimento" && part.state === "input-available"),
  );

  // Tras cada predicción, el tutor interviene sin que se lo pidan. Si falló,
  // explica desde la idea que tenía; si acertó, sube el nivel con un reto.
  // El marcador va en el mensaje para que el tutor ajuste la dificultad.
  useEffect(() => {
    if (predictions.length <= seen.current) {
      seen.current = predictions.length;
      return;
    }
    seen.current = predictions.length;
    const latest = predictions.at(-1);
    if (!latest || busy || pendingProposal) return;

    const experiment = EXPERIMENTS[latest.scene];
    const labelOf = (id: string) => experiment.options.find((option) => option.id === id)?.label ?? id;
    const chosen = labelOf(latest.option);
    const title = EXPERIMENT_TITLES[latest.scene];
    const hits = predictions.filter((prediction) => prediction.correct).length;
    const score = `Llevo ${hits} aciertos de ${predictions.length} predicciones.`;

    void sendMessage({
      text: latest.correct
        ? `En el experimento «${title}» predije «${chosen}» y acerté. ${score}`
        : `En el experimento «${title}» predije «${chosen}», pero la respuesta era «${labelOf(experiment.answer)}». ${score}`,
      metadata: { auto: { chosen, correct: latest.correct } },
    });
  }, [predictions, busy, pendingProposal, sendMessage]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text || busy || pendingProposal) return;
    void sendMessage({ text });
    setInput("");
  };

  const answer = (toolCallId: string, proposal: ProposeExperimentInput, accepted: boolean) => {
    void addToolOutput({
      tool: "proponerExperimento",
      toolCallId,
      output: accepted ? applyProposal(proposal) : { accepted: false, detail: "La persona ha preferido no hacerlo." },
    });
  };

  return (
    <section aria-labelledby="tutor-titulo" className="flex min-h-0 flex-1 flex-col">
      <h2 id="tutor-titulo" className="text-lg font-bold">
        Tutor
      </h2>

      <div ref={listRef} className="mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 sm:max-h-[50vh] sm:min-h-48 sm:flex-none">
        {messages.map((message) => {
          // Un mensaje automático no se muestra: la guía ya dice qué predijo y si acertó.
          if (message.role === "user" && message.metadata?.auto) return null;
          return (
            <div key={message.id} className={message.role === "user" ? "ml-6 bg-ink/5 p-3" : ""}>
              {/* "Tutor" ya es el título del panel: aquí solo lo oye el lector de pantalla. */}
              <p className={message.role === "user" ? "text-sm font-bold text-ink-soft" : "sr-only"}>
                {message.role === "user" ? "Tú" : "Tutor"}
              </p>
              {message.parts.map((part, index) => {
                if (part.type === "text") {
                  return (
                    <p key={index} className="whitespace-pre-wrap">
                      {part.text}
                    </p>
                  );
                }
                if (part.type === "tool-proponerExperimento") {
                  return <Proposal key={part.toolCallId} part={part} sceneId={sceneId} onAnswer={answer} />;
                }
                return null;
              })}
            </div>
          );
        })}
        {status === "submitted" && <p className="text-ink-soft">El tutor está pensando…</p>}
      </div>

      {error && (
        <div role="alert" className="mt-3 border-l-4 border-body-b pl-3">
          <p>{errorText(error)}</p>
          {!error.message.includes("tutor-no-disponible") && (
            <button type="button" onClick={() => void regenerate()} className="mt-1 underline">
              Reintentar
            </button>
          )}
        </div>
      )}

      {/* Para lectores de pantalla: la respuesta completa, una sola vez. */}
      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <form onSubmit={submit} className="mt-3 flex gap-2">
        <label htmlFor="tutor-mensaje" className="sr-only">
          Escribe al tutor
        </label>
        <input
          id="tutor-mensaje"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          disabled={pendingProposal}
          placeholder={pendingProposal ? "Responde primero a la propuesta" : "Pregunta lo que quieras"}
          className="min-w-0 flex-1 border border-ink/40 bg-paper px-3 py-2"
        />
        <button
          type="submit"
          disabled={busy || pendingProposal || input.trim() === ""}
          className="bg-ink px-4 py-2 font-bold text-paper hover:bg-ink/85 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </section>
  );
}

interface ProposalProps {
  readonly part: ProposalPart;
  readonly sceneId: SceneId;
  onAnswer(toolCallId: string, proposal: ProposeExperimentInput, accepted: boolean): void;
}

/** La tarjeta de una propuesta: qué quiere probar el tutor, qué va a cambiar (plegado, para quien quiera verlo) y Sí o No. */
function Proposal({ part, sceneId, onAnswer }: ProposalProps) {
  switch (part.state) {
    case "input-streaming":
      return <p className="text-ink-soft">Preparando una propuesta…</p>;
    case "input-available":
      return (
        <div className="mt-2 border border-body-a p-3">
          <p className="font-bold">Propuesta de experimento</p>
          <p className="mt-1">{part.input.reason}</p>
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer py-2 text-ink-soft">Ver los cambios</summary>
            <ul className="list-disc pl-5">
              {describeActions(part.input.actions, sceneId).map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </details>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onAnswer(part.toolCallId, part.input, true)}
              className="bg-body-a px-3 py-1.5 font-bold text-paper hover:bg-body-a/85"
            >
              Sí, pruébalo
            </button>
            <button
              type="button"
              onClick={() => onAnswer(part.toolCallId, part.input, false)}
              className="border border-ink px-3 py-1.5 font-bold hover:bg-ink/5"
            >
              No, gracias
            </button>
          </div>
        </div>
      );
    case "output-available":
      return (
        <p className="mt-2 text-sm text-ink-soft">
          {part.output.accepted ? "✓ Todo preparado: dale al Play para verlo." : "Propuesta rechazada."}
        </p>
      );
    case "output-error":
      return <p className="mt-2 text-sm text-ink-soft">No se pudo aplicar la propuesta.</p>;
    default:
      return null;
  }
}
