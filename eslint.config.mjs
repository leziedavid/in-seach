import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React Compiler rules — trop strictes pour une base de code existante
      "react-hooks/immutability": "off",
      "react-hooks/static-components": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/incompatible-library": "off",

      // React Compiler — erreurs de memoization non bloquantes
      "react-compiler/react-compiler": "off",

      // TypeScript — @ts-ignore est acceptable dans du code legacy
      "@typescript-eslint/ban-ts-comment": "off",

      // TypeScript — any acceptable dans les couches API et d'intégration
      "@typescript-eslint/no-explicit-any": "off",

      // JSX — apostrophes et guillemets dans le texte ne bloquent pas le build
      "react/no-unescaped-entities": "off",

      // Style — avertissements seulement, pas des erreurs bloquantes
      "prefer-const": "warn",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": "off",
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts"]
  }
]);

export default eslintConfig;
