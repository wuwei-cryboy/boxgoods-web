import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";
import globals from "globals";

/**
 * ESLint 9 flat config。
 *
 * 不使用 `eslint-config-next`：该包（15.5.28）以 @rushstack/eslint-patch
 * 做模块重定向，只导出 legacy (.eslintrc) 配置，在 ESLint 9 下会抛
 * "Failed to patch ESLint because the calling module was not recognized"。
 * 这里直接组合 typescript-eslint + prettier，覆盖等价规则集。
 */
export default tseslint.config(
  {
    ignores: [
      ".next/",
      "node_modules/",
      "out/",
      "*.config.*",
      "next-env.d.ts",
      "tsconfig.tsbuildinfo",
      "check_refs.js",
      "list_refs.js",
      "map_imgs.js",
      "_depth.mjs",
      "build.bat",
      "build.log.bat",
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // 常见易错项
      "no-debugger": "warn",
      "prefer-const": "warn",
      "no-var": "error",
    },
  },
  prettier,
);
