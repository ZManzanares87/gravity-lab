import { describe, expect, it } from "vitest";
import { createRateLimiter } from "../rateLimit";

describe("límite de peticiones", () => {
  it("permite hasta el límite y bloquea el resto dentro de la ventana", () => {
    let time = 0;
    const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => time });
    expect(limiter.allow("ip")).toBe(true);
    expect(limiter.allow("ip")).toBe(true);
    expect(limiter.allow("ip")).toBe(false);
    // Otra IP tiene su propio contador.
    expect(limiter.allow("otra")).toBe(true);
    // Pasada la ventana, vuelve a permitir.
    time = 1001;
    expect(limiter.allow("ip")).toBe(true);
  });
});
