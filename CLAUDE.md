# CLAUDE.md

@AGENTS.md

This file is intentionally a thin wrapper, and agent conventions are tiered.
`AGENTS.md` — imported above, so it is resident in every session — holds the
invariants an agent can violate without knowing it is in that domain, plus an
imperative pointer to each task-shaped procedure. Those procedures live in
`skills/*/SKILL.md` and are read on demand when their stated trigger applies,
so a session pays for the areas it actually touches. Review-time guidance for
Copilot lives in `.github/copilot-instructions.md`.

Add new durable learnings to whichever tier matches the learning's trigger —
never here.

## Claude-specific notes

- State intent and constraints; trust the model to plan. Prefer outcome-based
  instructions ("keep the tree green", "zero duplication") over prescriptive
  step lists, which degrade Fable-class model performance.
- Before non-trivial work, do a quick blind-spot pass: read the touched
  modules and their tests, and list what the issue/prompt leaves unstated
  (hidden constraints usually live in `eslint.config.mjs`, `vite.config.js`
  thresholds, and `AGENTS.md`).
- The shell may start on an old Node. Activate the repo version per command:
  `export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"; nvm use; hash -r`
  (`hash -r` is required because zsh caches the old `node` path).
