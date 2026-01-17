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
      // Turn off less critical rules
      'react/no-unescaped-entities': 'off', // Allow unescaped quotes in JSX
      '@next/next/no-img-element': 'off', // Allow img tags (we use them intentionally)
      
      // Enforce strict TypeScript rules
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      
      // Keep other rules as warnings
      '@typescript-eslint/no-empty-object-type': 'warn',
      '@next/next/no-html-link-for-pages': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
]);

export default eslintConfig;
