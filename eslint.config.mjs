import * as espree from "espree";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import { FlatCompat } from "@eslint/eslintrc";
import { fileURLToPath } from "node:url";
import jest from "eslint-plugin-jest";
import js from "@eslint/js";
import path from "node:path";
import react from "eslint-plugin-react";
import spellcheck from "eslint-plugin-spellcheck";
import stylistic from "@stylistic/eslint-plugin";
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
    ignores: ["dist/", "coverage/", "storybook-static/", ".claude/"],
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
      "@stylistic": stylistic,
      "@typescript-eslint": typescriptEslint,
      react: fixupPluginRules(react),
      spellcheck,
    },
    rules: {
      "@stylistic/no-trailing-spaces": "error",
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
          max: 520,
        },
      ],
      "max-lines-per-function": [
        "error",
        {
          max: 490,
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
      "react/jsx-max-depth": [
        "error",
        {
          max: 4,
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
            "claude",
            "columnheader",
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
            "globals",
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
            "popstate",
            "radiogroup",
            "readonly",
            "pragma",
            "rerender",
            "rerenders",
            "royale",
            "seedrandom",
            "Serializable",
            "svg",
            "tbody",
            "tsconfig",
            "tsx",
            "ul",
            "unmount",
            "unordered",
            "unselected",
            "utf",
            "vite",
            "vitest",
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
  {
    /*
     * Node build/data scripts run in a trusted local context and inherently do
     * dynamic property access over generated JSON, so relax the browser-focused
     * rules that do not apply here.
     */
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: {
        Buffer: "readonly",
        console: "readonly",
        fetch: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-magic-numbers": ["off"],
      camelcase: ["off"],
      "capitalized-comments": ["off"],
      "no-continue": ["off"],
      "security/detect-non-literal-fs-filename": ["off"],
      "security/detect-object-injection": ["off"],
      "spellcheck/spell-checker": ["off"],
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
      "@typescript-eslint/no-magic-numbers": ["off"],
      "@typescript-eslint/no-non-null-assertion": ["off"],
      "@typescript-eslint/unbound-method": "off",
      "jest/expect-expect": [
        "error",
        {
          assertFunctionNames: [
            "expect",
            "assertMatcherReturnsFalse",
            "expectPairsPoints",
            "expectFifteensPoints",
            "expectRunsPoints",
            "expectTotalPoints",
            "expectFiveStarterRelationRows",
            "expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual",
            "expectSort",
            "containsCutGroup",
            "expectCardLabelRendered",
            "expectCardLabelHasClass",
            "expectKeptAndDiscardedAfterClick",
            "expectCalculationsAfterClicks",
            "expectTotalHandPoints",
            "expectHandsInDescendingExpectedScoreOrder",
            "expectPossibleHandRendersSpan",
            "expectDealerRoleVisible",
            "expectPoneRoleVisible",
            "expectHydratedPoneState",
            "expectPushesAndDiscards",
            "expectMergedBackTo",
          ],
        },
      ],
      "jest/prefer-ending-with-an-expect": [
        "error",
        {
          additionalTestBlockFunctions: [],
          assertFunctionNames: [
            "expect",
            "assertMatcherReturnsFalse",
            "expectFiveStarterRelationRows",
            "expectAllScoredKeepDiscardsByScoreDescendingToStrictEqual",
            "expectPairsPoints",
            "expectFifteensPoints",
            "expectRunsPoints",
            "expectTotalPoints",
            "expectPossibleHandRendersSpan",
            "containsCutGroup",
            "expectCardLabelRendered",
            "expectCalculationsAfterClicks",
            "expectSort",
            "expectHandsInDescendingExpectedScoreOrder",
            "expectTotalHandPoints",
            "expectDealerRoleVisible",
            "expectPoneRoleVisible",
            "expectHydratedPoneState",
            "expectPushesAndDiscards",
            "expectMergedBackTo",
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
  {
    files: ["**/*.stories.ts*"],
    rules: {
      "jest/require-hook": "off",
    },
  },
];
