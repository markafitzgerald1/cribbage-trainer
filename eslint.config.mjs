import * as espree from "espree";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import jest from "eslint-plugin-jest";
import js from "@eslint/js";
import path from "node:path";
import react from "eslint-plugin-react";
import spellcheck from "eslint-plugin-spellcheck";
import tsParser from "@typescript-eslint/parser";
import typescriptEslint from "@typescript-eslint/eslint-plugin";

const compat = new FlatCompat({
  allConfig: js.configs.all,
  baseDirectory: path.dirname(fileURLToPath(import.meta.url)),
  recommendedConfig: js.configs.recommended,
});

const MAX_STATEMENTS = 20;

export default [
  {
    ignores: ["dist/", "coverage/", "storybook-static/"],
  },
  ...fixupConfigRules(
    compat.extends(
      "eslint:all",
      "plugin:jsx-a11y/recommended",
      "plugin:react/all",
      "plugin:react/jsx-runtime",
      "plugin:react-hooks/recommended",
      "plugin:security/recommended-legacy",
      "plugin:storybook/recommended",
      "prettier",
    ),
  ),
  {
    languageOptions: {
      ecmaVersion: 5,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
        project: ["./tsconfig.json"],
      },
      sourceType: "script",
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
      react: fixupPluginRules(react),
      spellcheck,
    },
    rules: {
      "@typescript-eslint/no-magic-numbers": [
        "error",
        {
          ignore: [0, 1],
          ignoreEnums: true,
        },
      ],
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/unbound-method": "off",
      "capitalized-comments": [
        "error",
        "always",
        {
          ignorePattern: "jscpd",
        },
      ],
      "dot-notation": [
        "error",
        {
          allowPattern: "^CI$",
        },
      ],
      "func-style": "off",
      "id-length": [
        "error",
        {
          exceptions: ["_"],
        },
      ],
      "max-lines": [
        "error",
        {
          max: 517,
        },
      ],
      "max-lines-per-function": [
        "error",
        {
          max: 473,
          skipBlankLines: true,
        },
      ],
      "max-statements": ["error", MAX_STATEMENTS],
      "no-magic-numbers": ["off"],
      "no-restricted-syntax": [
        "error",
        {
          message: "`it.todo()` is not allowed.",
          selector:
            "CallExpression[callee.object.name='it'][callee.property.name='todo']",
        },
      ],
      "no-shadow": "off",
      "no-ternary": "off",
      "no-warning-comments": [
        "error",
        {
          decoration: ["*"],
        },
      ],
      "one-var": [
        "error",
        {
          const: "never",
          let: "never",
          var: "always",
        },
      ],
      "react/jsx-filename-extension": [
        "error",
        {
          extensions: [".tsx"],
        },
      ],
      "react/jsx-no-literals": "off",
      "react/require-optimization": "off",
      "security/detect-object-injection": ["error"],
      "spellcheck/spell-checker": [
        "warn",
        {
          skipWords: [
            "autodocs",
            "callee",
            "camelcase",
            "charset",
            "checkbox",
            "checkboxes",
            "compat",
            "cpus",
            "discardable",
            "ecma",
            "enums",
            "entrypoint",
            "espree",
            "figcaption",
            "firefox",
            "fixup",
            "formatter",
            "func",
            "goto",
            "gtag",
            "href",
            "jscpd",
            "JSX",
            "keydown",
            "lang",
            "li",
            "listitem",
            "Matcher",
            "matchers",
            "mdx",
            "mjs",
            "Mobx",
            "mousedown",
            "msedge",
            "os",
            "pragma",
            "radiogroup",
            "pragma",
            "royale",
            "seedrandom",
            "tsconfig",
            "tsx",
            "ul",
            "unmount",
            "unordered",
            "utf",
            "vite",
            "webkit",
          ],
        },
      ],
    },
    settings: {
      componentWrapperFunctions: [
        "observer",
        {
          property: "styled",
        },
        {
          object: "Mobx",
          property: "observer",
        },
        {
          object: "<pragma>",
          property: "observer",
        },
      ],
      formComponents: [
        "CustomForm",
        {
          formAttribute: "endpoint",
          name: "Form",
        },
      ],
      "jsx-a11y": {
        components: {
          Calculation: "listitem",
          Calculations: "list",
          Card: "input",
          Hand: "list",
        },
      },
      linkComponents: [
        "Hyperlink",
        {
          linkAttribute: "to",
          name: "Link",
        },
      ],
      propWrapperFunctions: [
        "forbidExtraProps",
        {
          object: "Object",
          property: "freeze",
        },
        {
          property: "myFavoriteWrapper",
        },
        {
          exact: true,
          property: "forbidExtraProps",
        },
      ],
      react: {
        createClass: "createReactClass",
        flowVersion: "0.53",
        fragment: "Fragment",
        pragma: "React",
        version: "detect",
      },
    },
  },
  ...compat
    .extends(
      "plugin:@typescript-eslint/recommended",
      "plugin:@typescript-eslint/recommended-requiring-type-checking",
      "plugin:@typescript-eslint/strict",
    )
    .map((config) => ({
      ...config,
      files: ["**/*.ts*"],
    })),
  {
    files: ["eslint.config.mjs"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
  },
  {
    files: ["**/*.ts*"],

    languageOptions: {
      parser: tsParser,
    },
  },
  {
    files: ["**/vite.config.js", "**/*.mjs"],

    languageOptions: {
      ecmaVersion: 2022,
      parser: espree,
      sourceType: "module",
    },
  },
  ...compat.extends("plugin:jest/all").map((config) => ({
    ...config,
    files: ["**/*.test.ts*", "**/*.stories.ts*"],
  })),
  {
    files: ["**/*.test.ts*", "**/*.stories.ts*"],
    plugins: {
      jest,
    },
    rules: {
      "@typescript-eslint/no-non-null-assertion": ["off"],
      "@typescript-eslint/unbound-method": "off",
      "jest/expect-expect": [
        "error",
        {
          assertFunctionNames: [
            "expect",
            "expectPairsPoints",
            "expectFifteensPoints",
            "expectRunsPoints",
            "expectTotalPoints",
            "expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual",
            "expectSort",
            "expectCardLabelHasClass",
            "expectKeptAndDiscardedAfterClick",
            "expectCalculationsAfterClicks",
            "expectTotalHandPoints",
          ],
        },
      ],
      "jest/prefer-expect-assertions": ["off"],
      "jest/unbound-method": "error",
      "react/jsx-no-bind": ["off"],
      "security/detect-non-literal-regexp": ["off"],
      "security/detect-object-injection": ["off"],
    },
  },
  {
    files: ["**/*.d.ts"],
    rules: {
      "init-declarations": "off",
    },
  },
];
