import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import spellcheck from "eslint-plugin-spellcheck";
import react from "eslint-plugin-react";
import tsParser from "@typescript-eslint/parser";
import * as espree from "espree";
import jest from "eslint-plugin-jest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

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
    plugins: {
      "@typescript-eslint": typescriptEslint,
      spellcheck,
      react: fixupPluginRules(react),
    },

    languageOptions: {
      ecmaVersion: 5,
      sourceType: "script",

      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },

        project: ["./tsconfig.json"],
      },
    },

    settings: {
      react: {
        createClass: "createReactClass",
        pragma: "React",
        fragment: "Fragment",
        version: "detect",
        flowVersion: "0.53",
      },

      propWrapperFunctions: [
        "forbidExtraProps",
        {
          property: "freeze",
          object: "Object",
        },
        {
          property: "myFavoriteWrapper",
        },
        {
          property: "forbidExtraProps",
          exact: true,
        },
      ],

      componentWrapperFunctions: [
        "observer",
        {
          property: "styled",
        },
        {
          property: "observer",
          object: "Mobx",
        },
        {
          property: "observer",
          object: "<pragma>",
        },
      ],

      formComponents: [
        "CustomForm",
        {
          name: "Form",
          formAttribute: "endpoint",
        },
      ],

      linkComponents: [
        "Hyperlink",
        {
          name: "Link",
          linkAttribute: "to",
        },
      ],

      "jsx-a11y": {
        components: {
          Card: "input",
          Calculation: "listitem",
          Calculations: "list",
          Hand: "list",
        },
      },
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
          max: 343,
        },
      ],

      "max-lines-per-function": [
        "error",
        {
          max: 266,
          skipBlankLines: true,
        },
      ],

      "max-statements": ["error", 20],
      "no-magic-numbers": ["off"],
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
          var: "always",
          let: "never",
          const: "never",
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

      "spellcheck/spell-checker": [
        "warn",
        {
          skipWords: [
            "autodocs",
            "camelcase",
            "charset",
            "checkbox",
            "checkboxes",
            "cpus",
            "discardable",
            "entrypoint",
            "figcaption",
            "firefox",
            "formatter",
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
            "mousedown",
            "msedge",
            "os",
            "radiogroup",
            "royale",
            "seedrandom",
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

      "security/detect-object-injection": ["error"],
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
    files: ["**/*.ts*"],

    languageOptions: {
      parser: tsParser,
    },
  },
  {
    files: ["**/vite.config.js"],

    languageOptions: {
      parser: espree,
      ecmaVersion: 2022,
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
