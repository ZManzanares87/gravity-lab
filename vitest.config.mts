import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // El motor es TypeScript puro: no necesita simular un navegador.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
