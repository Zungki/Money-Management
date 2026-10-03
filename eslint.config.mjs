import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });
export default [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Keep ESLint feedback visible without making existing untyped legacy
      // component props block a production build. TypeScript still type-checks
      // the application during `next build`.
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
];
