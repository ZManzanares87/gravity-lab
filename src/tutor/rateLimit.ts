/**
 * Límite de peticiones por clave (la IP) en una ventana de tiempo.
 * Vive en memoria: en Vercel cada instancia del servidor tiene su propio
 * contador, así que es aproximado. Basta para frenar abusos; la garantía
 * real es el límite de gasto del espacio de trabajo en Anthropic.
 */
export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}) {
  const hits = new Map<string, number[]>();

  return {
    allow(key: string): boolean {
      const time = now();
      const recent = (hits.get(key) ?? []).filter((hit) => time - hit < windowMs);
      const allowed = recent.length < limit;
      if (allowed) recent.push(time);
      hits.set(key, recent);
      return allowed;
    },
  };
}
