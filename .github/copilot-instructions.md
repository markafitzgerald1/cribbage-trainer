# Copilot instructions

A two-player cribbage discard/play trainer. TypeScript + React 19, built with
Vite and deployed to GitHub Pages. The scoring engine is derived purely from
enumeration, simulation, and probability — never hard-coded heuristics or
hand-edited scoring/lookup tables.

`README.md` (setup), `AGENTS.md` and `CONTRIBUTING.md` (full conventions and
process), and `skills/*/SKILL.md` (Storybook coverage, CI validation) hold the
detail. This file is the concise reviewer's summary; prefer those over repeating
them.

## Layout

- `src/game/` — card model and scoring engine.
- `src/analysis/` — keep/discard enumeration and expected-value scoring.
- `src/ui-react/` — React components and CSS modules; new components get a
  matching `*.stories` file.
- `src/ui/` — framework-agnostic UI primitives.
- `tests-e2e/` — Playwright end-to-end and screenshot tests.

## Validation

Always validate with `npm run docker:build-and-test-all` before pushing; it
mirrors CI (lint, Jest, Storybook coverage, Playwright e2e/screenshots). A quick
local pass is `npm run lint && npm test`.

## Review focus (enforced — see AGENTS.md/CONTRIBUTING.md for rationale)

- Jest requires 100% global coverage; Storybook (Vitest) thresholds live in
  `vite.config.js`. New code needs matching tests.
- `jscpd` runs at 0% duplication — resolve by extracting helpers/components,
  not by suppressing it (`jscpd:ignore` is for import boilerplate only).
- File-scoped `eslint-disable` is banned; fix the code or scope a disable to one
  line.
- Keep expected values derived from enumeration/simulation; never add hand-coded
  heuristics or hand-edited scoring/lookup tables.
- Match the idioms already in the file you edit (e.g. explicit `undefined`
  defaults with a single-line `no-undefined` disable); TypeScript is strict and
  CSS modules use kebab-case classes.
