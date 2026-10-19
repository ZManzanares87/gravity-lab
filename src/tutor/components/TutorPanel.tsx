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
import { getLiveState } from "@/lab/liveState";
import type { SceneId } from "@/lab/scenes";
import { useLabStore } from "@/lab/store";
import { buildLabContext } from "../context";
import { describeActions } from "../describeActions";
import { TUTOR_TOOLS, type ProposeExperimentInput, type ProposeExperimentOutput } from "../tools";

type TutorMessage = UIMessage<unknown, UIDataTypes, InferUITools<typeof TUTOR_TOOLS>>;
type ProposalPart = Extract<TutorMessage["parts"][number], { type: "tool-proponerExperimento" }>;

/** Saludo fijo: aparece al instante, no cuesta nada y funciona también sin clave. */
const GREETING: TutorMessage = {
  id: "saludo",
  role: "assistant",
  parts: [
    {
      type: "text",
      text: "Hola, soy tu tutor. Aquí puedes soltar objetos, alejarlos de la Tierra, lanzarlos en órbita y ver qué pasa con tres estrellas. ¿Tienes alguna curiosidad sobre la gravedad, o prefieres empezar experimentando? Puedo proponerte experimentos y, si me das permiso, prepararlos en el laboratorio.",
    },
  ],
};

function textOf(message: TutorMessage): string {
  return message.parts.flatMap((part) => (part.type === "text" ? [part.text] : [])).join(" ");
}

/** Aplica una propuesta aceptada con las mismas acciones que usan los controles. */
function applyProposal(input: ProposeExperimentInput): ProposeExperimentOutput {
  const { dispatch } = useLabStore.getState();
  const rejected = input.actions.flatMap((action) => {
    const result = dispatch(action);
    return result.ok ? [] : [result.reason];
  });
  return {
    accepted: true,
    detail:
      rejected.length === 0
        ? "La persona ha aceptado. El laboratorio ya muestra el experimento; su estado actualizado llega en el contexto."
        : `La persona ha aceptado, pero algunas acciones no eran válidas: ${rejected.join(" ")}`,
  };
}

/** El servidor responde con un código conocido; aquí se traduce a un mensaje útil. */
function errorText(error: Error): string {
  if (error.message.includes("tutor-no-disponible")) {
    return "El tutor no está disponible ahora mismo: falta configurar la clave de la IA. Todo lo demás funciona igual: los experimentos, sus explicaciones y «Ver la ley».";
  }
  if (error.message.includes("demasiadas-peticiones")) {
    return "Has enviado muchos mensajes seguidos. Prueba de nuevo dentro de un rato.";
  }
  return "No he podido responder. Comprueba la conexión y prueba de nuevo.";
}

export function TutorPanel() {
  const sceneId = useLabStore((state) => state.sceneId);
  const [input, setInput] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

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
    // Se anuncia la respuesta completa, no cada trocito mientras llega.
    onFinish: ({ message }) => setAnnouncement(textOf(message)),
  });

  const busy = status === "submitted" || status === "streaming";
  const pendingProposal = messages.some((message) =>
    message.parts.some((part) => part.type === "tool-proponerExperimento" && part.state === "input-available"),
  );

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
    <section aria-labelledby="tutor-titulo" className="flex flex-col">
      <h2 id="tutor-titulo" className="text-lg font-bold">
        Tutor
      </h2>

      <div ref={listRef} className="mt-3 max-h-[60vh] min-h-48 space-y-4 overflow-y-auto pr-1">
        {messages.map((message) => (
          <div key={message.id} className={message.role === "user" ? "ml-6 bg-ink/5 p-3" : ""}>
            <p className="text-sm font-bold text-ink-soft">{message.role === "user" ? "Tú" : "Tutor"}</p>
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
        ))}
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

/** La tarjeta de una propuesta: qué quiere probar el tutor, qué va a cambiar, y Sí o No. */
function Proposal({ part, sceneId, onAnswer }: ProposalProps) {
  switch (part.state) {
    case "input-streaming":
      return <p className="text-ink-soft">Preparando una propuesta…</p>;
    case "input-available":
      return (
        <div className="mt-2 border border-body-a p-3">
          <p className="font-bold">Propuesta de experimento</p>
          <p className="mt-1">{part.input.reason}</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {describeActions(part.input.actions, sceneId).map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ul>
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
          {part.output.accepted ? "✓ Propuesta aceptada." : "Propuesta rechazada."}
        </p>
      );
    case "output-error":
      return <p className="mt-2 text-sm text-ink-soft">No se pudo aplicar la propuesta.</p>;
    default:
      return null;
  }
}
