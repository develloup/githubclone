import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript", "plugin:@typescript-eslint/recommended"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn", // ✅ Keine harten Fehler bei ungenutzten Variablen
      "react-hooks/exhaustive-deps": "warn", // ✅ `useEffect`-Warnungen reduzieren
      "no-console": "off", // ✅ Erlaubt Debugging mit `console.log`
      "react/react-in-jsx-scope": "off", // ✅ Next.js benötigt kein `import React`
    },
  },
];

export default eslintConfig;
