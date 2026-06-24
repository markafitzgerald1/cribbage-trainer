# Copilot instructions

A two-player cribbage discard/play trainer. TypeScript + React 19, built with
Vite and deployed to GitHub Pages. The scoring engine is derived purely from
enumeration, simulation, and probability — never hard-coded heuristics.

`README.md` (setup), `AGENTS.md` and `CONTRIBUTING.md` (full conventions and
process), and `skills/*/SKILL.md` (Storybook coverage, CI validation) hold the
detail. This file is the concise reviewer's summary; prefer those over repeating
them.

## Layout

- `src/game/` — card model, scoring engine, and crib EV table lookup.
- `src/analysis/` — keep/discard enumeration and expected-value scoring.
- `src/ui-react/` — React components (each has a `*.stories` file) and CSS
  modules.
- `src/ui/` — framework-agnostic UI primitives.
- `tests-e2e/` — Playwright end-to-end and screenshot tests.
- `src/game/expectedCribPointsTable.json` — vendored artifact from the
  `simulate-cribbage-games` pipeline; refresh via `npm run table:update`.

## Validation

Always validate with `npm run docker:build-and-test-all` before pushing; it
mirrors CI (lint, Jest, Storybook coverage, Playwright e2e/screenshots). A quick
local pass is `npm run lint && npm test`.

## Review focus (enforced — see AGENTS.md/CONTRIBUTING.md for rationale)

- Jest requires 100% global coverage; Storybook (Vitest) thresholds live in
  `vite.config.js`. New code needs matching tests and a `*.stories` file.
- `jscpd` runs at 0% duplication — resolve by extracting helpers/components,
  not by suppressing it (`jscpd:ignore` is for import boilerplate only).
- File-scoped `eslint-disable` is banned; fix the code or scope a disable to one
  line.
- Do not hand-edit or regenerate `expectedCribPointsTable.json` in this repo.
- Match existing idioms (e.g. `new Map<…>().get("missing")` for a typed
  `undefined`); TypeScript is strict and CSS modules use kebab-case classes.
