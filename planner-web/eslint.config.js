import js from "@eslint/js"
import globals from "globals"
import reactHooks from "eslint-plugin-react-hooks"
import reactRefresh from "eslint-plugin-react-refresh"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import tseslint from "typescript-eslint"
import { defineConfig, globalIgnores } from "eslint/config"

import noJsxSpaceExpression from "./eslint-rules/no-jsx-space-expression.js"
import noNativeDateInput from "./eslint-rules/no-native-date-input.js"

export default defineConfig([
	globalIgnores(["dist", "src/api/generated"]),
	{
		files: ["**/*.{ts,tsx}"],
		extends: [
			js.configs.recommended,
			tseslint.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
		],
		languageOptions: {
			globals: globals.browser,
		},
		plugins: {
			local: {
				rules: {
					"no-jsx-space-expression": noJsxSpaceExpression,
					"no-native-date-input": noNativeDateInput,
				},
			},
			"simple-import-sort": simpleImportSort,
		},
		rules: {
			"local/no-jsx-space-expression": "error",
			"local/no-native-date-input": "error",
			"simple-import-sort/exports": "error",
			"simple-import-sort/imports": "error",
		},
	},
	{
		files: ["**/src/components/ui/**/*.{ts,tsx}"],
		rules: {
			"react-refresh/only-export-components": "off",
		},
	},
	{
		files: ["**/src/routes/**/*.{ts,tsx}"],
		rules: {
			"react-refresh/only-export-components": "off",
		},
	},
])
