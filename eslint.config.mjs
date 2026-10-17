import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // El motor físico es TypeScript puro: no puede depender de React,
  // Next.js, el estado de la app ni ningún otro módulo de src/.
  {
    files: ["src/physics/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "react",
                "react/**",
                "react-dom",
                "react-dom/**",
                "next",
                "next/**",
                "zustand",
                "@/**",
              ],
              message:
                "src/physics es TypeScript puro: no puede importar React, Next.js ni otros módulos de la app.",
            },
          ],
        },
      ],
    },
  },

  // Siempre al final: desactiva las reglas de formato que chocan con Prettier.
  prettier,

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
