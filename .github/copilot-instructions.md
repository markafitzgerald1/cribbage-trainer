# Copilot instructions

A browser cribbage trainer: TypeScript + React 19, built with Vite. Tested
with Jest (unit), Storybook + Vitest (browser/interaction), and Playwright
(end-to-end and screenshots). Linted with ESLint, Prettier, Stylelint, and
jscpd.

`AGENTS.md` and `CONTRIBUTING.md` hold the full conventions. When reviewing,
keep these enforced project rules in mind so suggestions stay actionable:

- **Coverage is enforced.** Jest requires 100% global coverage; the Storybook
  (Vitest) coverage thresholds live in `vite.config.js`. New code needs
  matching tests, and every component has a `*.stories` file.
- **Zero code duplication.** `jscpd` runs at a 0% threshold. Resolve
  duplication by extracting helpers/components, not by suppressing it;
  `jscpd:ignore` is reserved for unavoidable boilerplate such as import blocks.
- **No file-scoped `eslint-disable`.** Fix the code or update the shared
  config; scope any unavoidable disable to a single line.
- **Match existing idioms.** TypeScript is strict; prefer the established
  patterns (for example the `new Map<…>().get("missing")` typed-undefined
  sentinel). CSS modules use kebab-case class names imported as camelCase.
- **`src/game/expectedCribPointsTable.json` is a vendored artifact** generated
  by the `simulate-cribbage-games` pipeline and refreshed via
  `npm run table:update`. Do not hand-edit it or suggest regenerating it here.
- **Validation:** `npm run lint && npm test`; full CI parity comes from
  `npm run docker:build-and-test-all` (builds plus Playwright e2e/screenshots).
