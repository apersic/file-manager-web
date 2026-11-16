import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

const sharedCode = ["./src/components", "./src/config", "./src/lib"];

const importZones = [
  ...sharedCode.flatMap((target) => [
    {
      target,
      from: "./src/app",
      message: "Shared code does not import app.",
    },
    {
      target,
      from: "./src/features",
      message: "Shared code does not import features.",
    },
  ]),
  {
    target: "./src/features",
    from: "./src/app",
    message: "Features do not import app.",
  },
  {
    target: "./src/features/file-manager",
    from: "./src/features",
    except: ["./file-manager"],
    message: "Features do not import each other.",
  },
];

export default tseslint.config(
  {
    ignores: ["dist", "node_modules", "coverage"],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "error",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        { prefer: "type-imports", fixStyle: "inline-type-imports" },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      import: importPlugin,
    },
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.app.json",
        },
      },
    },
    rules: {
      "import/no-restricted-paths": ["error", { zones: importZones }],
    },
  },
  {
    files: ["vite.config.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
