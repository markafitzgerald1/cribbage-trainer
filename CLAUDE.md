# CLAUDE.md

@AGENTS.md

This file is intentionally a thin wrapper: `AGENTS.md` is the single source
of truth for agent conventions in this repository. Add new durable learnings
there (or to `.github/copilot-instructions.md` for review-time guidance and
`skills/*/SKILL.md` for task-shaped procedures), not here.

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
