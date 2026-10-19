import { anthropic, type AnthropicProviderOptions } from "@ai-sdk/anthropic";
import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { TUTOR_SYSTEM_PROMPT } from "@/tutor/prompt";
import { createRateLimiter } from "@/tutor/rateLimit";
import { TUTOR_TOOLS } from "@/tutor/tools";

export const maxDuration = 30;

const MODEL = process.env.TUTOR_MODEL || "claude-haiku-5-5";
/** Límites por petición: acotan el coste de cada mensaje. */
const MAX_MESSAGES = 20;
const MAX_CONTEXT_CHARS = 4000;
const MAX_OUTPUT_TOKENS = 600;

/** 30 mensajes por hora y por IP (aproximado en serverless, ver rateLimit.ts). */
const limiter = createRateLimiter({ limit: 30, windowMs: 60 * 60 * 1000 });

const requestSchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
  labContext: z.string(),
});

/**
 * Se queda con los últimos mensajes, empezando siempre por uno de la
 * persona: el saludo inicial del tutor es fijo (no se genera con la IA)
 * y el modelo debe recibir la conversación empezando por la persona.
 */
function trimHistory(messages: UIMessage[]): UIMessage[] {
  const recent = messages.slice(-MAX_MESSAGES);
  const firstUser = recent.findIndex((message) => message.role === "user");
  return firstUser === -1 ? [] : recent.slice(firstUser);
}

export async function POST(request: Request) {
  // Sin clave: modo reducido. La interfaz reconoce este código y lo explica.
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "tutor-no-disponible" }, { status: 503 });
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (!limiter.allow(ip)) {
    return Response.json({ error: "demasiadas-peticiones" }, { status: 429 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return Response.json({ error: "peticion-no-valida" }, { status: 400 });
  }

  const messages = trimHistory(parsed.data.messages);
  if (messages.length === 0) {
    return Response.json({ error: "peticion-no-valida" }, { status: 400 });
  }

  const result = streamText({
    model: anthropic(MODEL),
    system: `${TUTOR_SYSTEM_PROMPT}\n\nEstado actual del laboratorio:\n${parsed.data.labContext.slice(0, MAX_CONTEXT_CHARS)}`,
    messages: await convertToModelMessages(messages),
    tools: TUTOR_TOOLS,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    // Sin razonamiento previo: respuestas cortas, más rápidas y más baratas.
    providerOptions: {
      anthropic: { thinking: { type: "disabled" } } satisfies AnthropicProviderOptions,
    },
  });

  return result.toUIMessageStreamResponse();
}
