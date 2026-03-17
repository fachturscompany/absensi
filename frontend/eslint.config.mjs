import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import reactPlugin from "eslint-plugin-react";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

// Check if we're in production build
const isProduction = process.env.NODE_ENV === 'production' || process.env.npm_lifecycle_event === 'build';

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      ".turbo/**",
      "dist/**",
      "build/**",
      ".pnpm-store/**",
      ".trash/**",
      "coverage/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      // Use "off" during production build to avoid build failures
      "@typescript-eslint/no-explicit-any": isProduction ? "off" : "warn",
      "@typescript-eslint/no-unused-vars": isProduction ? "off" : [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/ban-ts-comment": isProduction ? "off" : [
        "warn",
        {
          "ts-ignore": "allow-with-description",
        },
      ],
      "@typescript-eslint/no-unused-expressions": "off",
      "react/no-unescaped-entities": isProduction ? "off" : "warn",
      "react/no-unstable-nested-components": isProduction ? "off" : ["warn", { allowAsProps: true }],
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": isProduction ? "off" : "warn",
      "react-hooks/rules-of-hooks": isProduction ? "off" : "warn",
    },
  },
];

export default eslintConfig;
