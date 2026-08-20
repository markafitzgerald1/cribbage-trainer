# CLAUDE.md

@AGENTS.md

This file is intentionally a thin wrapper, and agent conventions are tiered.
`AGENTS.md` — imported above, so it is resident in every session — holds the
invariants an agent can violate without knowing it is in that domain, plus an
imperative pointer to each task-shaped procedure. Those procedures live in
`skills/*/SKILL.md` and are read on demand when their stated trigger applies,
so a session pays for the areas it actually touches. Review-time guidance for
Copilot lives in `.github/copilot-instructions.md`.

Add new durable learnings to whichever tier matches the learning's trigger:
`AGENTS.md` for what binds every session, a skill for what a stated trigger
loads on demand. What belongs here instead is the narrow set that is true of
Claude Code alone — its harness, its worktrees, this machine's shell — since
no other harness reads this file and the shared contract should not carry
guidance only one tool can use.

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
- Working inside a `.claude/worktrees/<name>` checkout changes what several
  tools see, and each difference has already been mistaken for a real failure:
  - `jest.config.json` ignores `/.claude/`, and the worktree's absolute path
    contains it, so a bare `npx jest` finds no tests at all. Override the
    list, and drop coverage, whose global thresholds fail a focused run that
    otherwise passed. Keep `--runTestsByPath`: without it the paths are
    swallowed by the preceding array flag and the whole suite runs.

    ```bash
    npx jest --coverage=false \
      --testPathIgnorePatterns '/tests-e2e/' \
      --runTestsByPath <file>
    ```

  - `npm run lint:cspell` reports "Files checked: 0" and exits 1, because the
    parent repository's `.gitignore` excludes `/.claude/` and `--gitignore`
    therefore excludes the whole worktree. Check changed files directly with
    `npx cspell --no-gitignore <files>`.
  - The worktree starts with a nearly empty `node_modules`. Most tools resolve
    upward to the parent repository's copy, but Vitest browser mode (Storybook
    tests and coverage) fails with "Failed to fetch dynamically imported
    module" until `npm install` is run inside the worktree.
  - Playwright's non-CI `reuseExistingServer` will reuse a stale `vite preview`
    left on port 4173 by the main checkout, running e2e against an old bundle.
  - Docker and CI are unaffected by all of the above: they check out normally.

## Cloud sessions (Claude Code on the web)

A cloud session is a fresh container, not this machine, and much of what the
local setup takes for granted is absent there. Bootstrap them before running
any gate, or a working tree looks broken. For how to run e2e once the image
exists, read `skills/testing-e2e/SKILL.md` — the pixel comparison needs its
own handling and that is where it lives.

- The Docker daemon is not running, though the CLI, `dockerd`, and root are
  all present; there is simply no init system to start it. Launch it directly
  (`setsid nohup dockerd > /tmp/dockerd.log 2>&1 < /dev/null &`), then poll
  `docker info` until it answers. It does not reliably survive a turn
  boundary, so re-check before each build; images live in `/var/lib/docker`
  and do survive, so a restart costs seconds rather than a rebuild.
- Containers reach the network but do not trust the session's egress proxy,
  so the build dies at the `actionlint` download with "SSL certificate
  problem: self-signed certificate in certificate chain". **Fix this from
  the session, never in the repository.** Generate a throwaway Dockerfile
  outside the working tree that prepends the CA install to the repo's, and
  build from that:

  ```bash
  CA=/usr/local/share/ca-certificates/ccr.crt
  { echo "FROM mcr.microsoft.com/playwright:v1.61.1-noble"
    echo "COPY --from=certs ca-bundle.crt $CA"
    echo "RUN update-ca-certificates"
    tail -n +2 Dockerfile
  } > "$SCRATCH/Dockerfile.ca"
  docker build --build-context certs=/root/.ccr -f "$SCRATCH/Dockerfile.ca" \
    -t cribbage-trainer-integration-tests .
  ```

  The committed `Dockerfile` is correct as written and must stay
  byte-identical: those three lines name a CA path that exists only in this
  sandbox, so committing them breaks the build for CI and every other
  machine. With them applied out of tree the image builds in about three
  minutes with every lint, unit, and Storybook step green.

- Docker Hub is blocked by egress policy (`hello-world` fails on
  `production.cloudfront.docker.com`), but `mcr.microsoft.com` is allowed, so
  the repo's own base image pulls normally. Also blocked:
  `cdn.playwright.dev`, and the deployed site itself, so a cloud session
  cannot check <https://markafitzgerald1.github.io/cribbage-trainer/>.
- Node is 22 there with no `nvm`, so the `nvm use` line above does not apply
  and `.nvmrc`'s pinned 24 is unreachable on the host. Only the Docker path
  runs the pinned runtime. Host-side results are useful for fast iteration
  but are **not** evidence about the runtime this project ships: a green
  `npm test` on the host says nothing about Node 24.
- Because `cdn.playwright.dev` is blocked and the preinstalled browsers in
  `/opt/pw-browsers` are the wrong build, `npm run storybook:test:coverage`
  fails on the host until the right ones are lifted out of the built image
  (`docker cp "$(docker create <image>):/ms-playwright/." /opt/pw-browsers/`).
  Its reported totals then match the Docker run exactly, so coverage
  thresholds can be re-pinned from either.
- Raw Actions job logs are unreachable: `gh api` on a job's `logs` endpoint
  redirects to an Azure `*.blob.core.windows.net` host that egress policy
  refuses, so the fetch 403s rather than returning the log. The
  GitHub MCP `get_job_logs` tool serves the same content through the API and
  works, so read a CI failure that way instead of concluding the run is
  opaque. Its `tail_lines` default of 500 lands inside the post-job cleanup
  on this workflow; ask for more to reach the Playwright summary.
- `gh` is not installed; its release tarball downloads and runs fine. Note
  that `gh auth status` reports "The token in GH_TOKEN is invalid" while REST
  calls succeed — the tool's own status output lies about its capability,
  the same trap as Copilot's `reviewRequests` stub, so test a real read
  before believing it. Arbitrary `gh api graphql` is refused ("only the
  pinned set of PR-review operations is served"), which takes out the
  review-thread queries and `resolveReviewThread` in `AGENTS.md`; use the
  GitHub MCP tools instead, whose `get_review_comments` returns the same
  `is_resolved`/`is_outdated` metadata. The project board has no substitute
  there — `gh project item-list` fails outright.
- Commit signing works here (`gpg.format=ssh`, with the key supplied through
  an agent), so do not pass `--no-gpg-sign`: sign intermediate commits,
  because this session's stop-hook check rejects unsigned ones. The bypass
  rule in `AGENTS.md` assumes a sandbox where no signing key is available
  and does not apply. `git log` still reports `signed: N` afterwards because
  `gpg.ssh.allowedSignersFile` is unset locally; that is a local
  verification gap, not an unsigned commit, so confirm with
  `git cat-file commit HEAD | grep gpgsig` rather than trusting `%G?`.
- Foreground commands are capped at 600s, which the ~3 minute Docker build
  fits but not by much; commands started in the background survive across
  turns, so run the gate that way and poll its log.
