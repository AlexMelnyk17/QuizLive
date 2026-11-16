import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
	globalIgnores(['dist', 'coverage', 'wwwroot', 'node_modules']),
	{
		files: ['**/*.{ts,tsx}'],
		extends: [
			js.configs.recommended,
			...tseslint.configs.recommendedTypeChecked,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite
		],
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		rules: {
			// TanStack Router uses throw redirect() (not Error); re-enable when using a layout-route helper.
			'@typescript-eslint/only-throw-error': 'off',
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['../*', './*'],
							message:
								'Use path aliases (@theme, @components/ui, @modules, @src, etc.) instead of relative imports.'
						}
					]
				}
			]
		}
	},
	{
		files: [
			'src/api/**/*.ts',
			'src/modules/**/api/**/*.ts',
			'src/modules/**/hooks/**/*.ts',
			'src/modules/**/utils/**/*.ts',
			'src/router.tsx',
			'src/utils/**/*.ts'
		],
		ignores: ['**/*.test.ts'],
		rules: {
			'@typescript-eslint/no-magic-numbers': [
				'error',
				{
					ignore: [0, 1, -1],
					ignoreEnums: true,
					ignoreNumericLiteralTypes: true,
					ignoreReadonlyClassProperties: true,
					ignoreTypeIndexes: true
				}
			]
		}
	},
	{
		files: [
			'src/modules/**/components/**/*.{ts,tsx}',
			'src/layout/**/*.{ts,tsx}'
		],
		rules: {
			'no-restricted-imports': [
				'error',
				{
					patterns: [
						{
							group: ['../*', './*'],
							message:
								'Use path aliases (@theme, @components/ui, @modules, @src, etc.) instead of relative imports.'
						}
					],
					paths: [
						{
							name: '@api/client',
							message:
								'Components must call module *Api.ts helpers, not @api/client directly.'
						}
					]
				}
			]
		}
	},
	eslintConfigPrettier
])
