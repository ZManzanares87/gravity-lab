import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // El mismo alias que tsconfig.json: "@/..." apunta a src/.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // El motor es TypeScript puro: no necesita simular un navegador.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
