---
name: working-an-issue
description: Use before starting work on a GitHub issue, and when you triage or draft one — what the issue body, the plan comment, and the pull request each record, the shape an issue should have, the project board, branch and PR shape, what a review guide and testing plan owe a reader, how to request Copilot and verify it, and the Codex review loop that has to run before a human is asked to look.
compatibility: Requires the gh CLI for issue, PR, review, and project board operations.
---

# Working an issue end to end

**Description:** The delivery shape expected here, in order, plus the board
shape and review mechanics that have each produced a wrong conclusion when
guessed at.

**Where each fact belongs:** the issue, its plan comment, and the pull request
record different things, and a fact filed in the wrong one is effectively
lost — a reader looking for what was agreed should never have to reconstruct
it from a diff.

- The **issue body** is intent and accepted scope: what problem is being
  solved and what would count as solving it. It is not a running log, and it
  does not narrate how the work went.
- A **dated edit to the issue body** is how an approved scope change is
  recorded. Scope that moves without one leaves the issue describing work
  nobody agreed to, and no reader can tell which version a reviewer read.
  #775 gaining task 5 from #760 is the worked example.
- An **attributed issue comment** is the implementation plan: the approach,
  the per-item calls being made, and any scope call taken rather than asked
  about. It is posted before the code, so it can be argued with while
  changing course is still cheap, and it is what the diff is checked against.
- The **pull request** records the implementation delta, the proof it works,
  the review findings and how each was answered, the residual risk, and the
  final closing decision. Anything learned while building belongs here, not
  backfilled into the issue body.

Picking up someone else's work means reading the pair: the issue says what was
agreed, the pull request says what actually happened.

**Learnings:**

- The order is: post the plan as an attributed comment on the issue **before**
  writing code; move the issue to In Progress on the board (below);
  implement on a `feature/<issue>-<slug>` branch; push once the branch has one
  commit and open the PR immediately, because opening the PR is what starts
  the first CI run and publishes the first preview — a branch pushed with no
  PR runs nothing; open it as a draft if the work is not ready to read; then
  push the rest.
- **One authoritative full gate per pushed head, and reviews come after it.**
  `.husky/pre-commit` runs the fast `npm run verify:fast` filter, not the
  merge gate, so a landed commit is not validated work. Before requesting a
  Codex or Copilot review by hand, wait for required CI to be green on the
  exact SHA — a manual review of a head that then fails CI is spent twice,
  once on the bot's budget and once on the round it forces (the automatic
  round is exempt: you do not control it). Run
  `npm run docker:build-and-test-all` locally instead only when CI cannot be
  that gate — unpushed work, or a Docker-only reproduction. A `--no-verify`
  commit skipped `verify:fast`, not CI's gate, so just run `verify:fast` by
  hand before pushing.
- During a review fix the loop is: reproduce with a regression test that
  fails against the unfixed code, run the focused test plus `verify:fast`,
  commit and push, let required CI run the full gate for that SHA, then
  reply to and resolve the threads. The push starts the next automatic
  Codex round; you only send `@codex review` if that round does not land
  (see below).
- The PR body carries a human review guide and a manual testing plan. Let the
  automatic Copilot and Codex reviews land, run the loop to a clean round,
  and only then ask for human review — the human's attention is the scarce
  resource here and comes last, not first.
- The review guide is what makes a PR reviewable rather than merely correct: a
  suggested file reading order, the design decisions worth challenging rather
  than only the ones that worked, and honest flags for anything a reader would
  want to know and could otherwise miss — a lowered coverage threshold, a test
  whose environment could not reproduce the case it asserted, an approximation
  left standing. A guide that only restates the diff has not done its job.
- The manual testing plan says what a human should do in the deployed preview
  and what they should see. Be explicit about what no automated gate here
  covers: a real phone, a real network, a real Google Analytics stream. When
  the human runs those steps, record the result in the PR body, and say
  plainly if later commits have moved the code out from under that run.
- The automatic reviews (`AGENTS.md`, GitHub PR Reviews) do most of the
  loop: Codex usually reviews every pushed head, Copilot the opening PR.
  Two things they leave you. If a Codex round is missing on the head a
  human will read — smart detect skipped it, or it came back a quota stub
  — request `@codex review` by hand, but on a quota stub wait for the quota
  to recover first rather than re-requesting into the same reply. And
  Copilot's automatic review does not reliably re-fire on a new head;
  re-request it (once CI is green) with this, since
  `gh pr edit --add-reviewer copilot` cannot resolve that login:

  ```bash
  gh api --method POST \
    --raw-field 'reviewers[]=copilot-pull-request-reviewer[bot]' \
    repos/<owner>/<repo>/pulls/<n>/requested_reviewers
  ```

  Afterwards `gh pr view <n> --json reviewRequests` still returns `[]`, and
  the REST response's own `requested_reviewers` array is empty — Copilot is
  simply not represented there, which is **not** evidence the request failed
  and must not be retried on that basis. Confirm it in
  `gh api --paginate repos/<owner>/<repo>/issues/<n>/timeline`, which shows
  `review_requested` with `requested_reviewer.login == "Copilot"` followed by
  `copilot_work_started`.

- Copilot is slow and sometimes silent: it can take several minutes to start,
  and it can fail to start at all — its review then says so, blaming a missing
  runner or a timeout. Wait well past the point Codex would have answered
  before reporting that Copilot has not reviewed, and say which of the two it
  is: not yet, or reported as failed to start.
- Read the body of any review that arrives before claiming a review happened.
  Both bots can return a stub instead: Copilot when the requester is out of
  quota, Codex when its usage limits are reached.
- The Codex loop and the review-thread mechanics that bind every PR — request
  without asking, iterate to a clean round, reply to and resolve every thread
  — are in `AGENTS.md` under GitHub PR Reviews, because they apply to any PR
  and not only to issue work.
- Move an issue to **In Progress** on the `Cribbage Trainer` project board when
  you start work on it; merging a PR whose body closes the issue moves it to
  Done on its own. A board reading Todo while a branch and PR exist misreports
  what is being worked, and the board is how the state of play is read. It is
  project 1 for this repository's owner. The board is named for this
  repository while tracking both, because the sibling's output — the vendored
  expected-points artifacts — exists to feed this app, so its work is
  ultimately work on this product. Both repositories describe a mission
  broader than that name, so the board's name can widen or change as the app
  does. The condition that makes it wrong rather than merely loose is the
  sibling gaining a purpose this app does not consume — published as a
  library, or as research for someone else — because the name only holds
  while everything on the board is ultimately work on this product. Until
  that happens the mismatch is a known intermediate state, not a filing
  error. Read the Status field and its option
  ids with `gh project field-list 1 --owner <owner> --format json` (Paused,
  Discovery & Design, Todo, In Progress, Done), find the item id with
  `gh project item-list 1 --owner <owner> --limit 400 --format json` — the
  board holds close to 300 items, so the default limit hides most of them —
  then set it with `gh project item-edit`, passing the item, project, field,
  and In Progress option ids.
- The Status column has a meaning that was agreed 2026-09-06 and is written
  down nowhere else, so an agent reading the board off the column names is
  otherwise guessing:
  - **Todo** — eligible to start now. Nothing deferred and nothing blocked
    belongs here, so the column reads directly as the available work queue.
  - **In Progress** — a branch or PR exists. Set it when work starts; a
    merged PR whose body closes the issue moves it to Done on its own.
  - **Paused** — deferred or gated. Covers `Beyond MLP` milestone items and
    `blocked`-labelled items whose blockers have not landed.
  - **Discovery & Design** — still being refined, not yet a scoped unit of
    work.
  - **Done** — closed.
- Those meanings imply six board invariants, each worth checking because
  nothing enforces it: every open issue is on the board; every open issue
  has a milestone; every board item has a Status set (a `--project` add
  leaves it empty, so the item shows in no column); no `Beyond MLP` item and
  no `blocked` item sits in Todo; nothing closed sits outside Done; and
  nothing still open sits in Done, where an accidental drop hides live work
  while passing every other check.
- The board has no Priority field, yet the work is still ranked: priority is
  the milestone, then the Status column, then the manual top-to-bottom order
  of cards within a column. The top of Todo is the default next issue to
  pick up — and `Minimum Lovable Product` is the active milestone with
  `Beyond MLP` deferred. An agent that hunts for a Priority field finds none
  and can misread the board as a flat bag of work; one that treats Todo as
  unordered picks the wrong issue next.
- The board spans two repositories whose issue numbers are scoped
  independently, so two unrelated issues can carry the same number and meet
  on one board. A board audit must therefore key each item on the repository
  and number together, `(content.repository, content.number)`, never
  `content.number` alone.
  Project 1 tracks `cribbage-trainer` and its sibling
  `simulate-cribbage-games` together — close to 300 items — and #22, #23,
  #101, and #102 each exist in both. Keying on the number alone silently
  merges them: one pass reported trainer #22 and #23 as "open but marked
  Done" when they were Todo and the Done rows belonged to the simulator,
  and it buried a real finding — a `Beyond MLP` item sitting in trainer's
  Todo — under the simulator's #22.
- Board audits fail silently in other ways, and one session shipped three
  wrong-but-well-formed answers in a row. GraphQL `items(first: 100)`
  truncated that board with no error — the first page held every Todo item
  but one, so the column looked complete while an issue hid at its tail. Use
  `gh project item-list 1 --owner <owner> --limit 400`, the limit trap the
  In Progress bullet already flags for the CLI default, and pass an explicit
  `--limit` to every `gh issue list` too — it defaults to 30, so a repo with
  more matching issues drops the overflow while the totals still reconcile.
  `comm -13` fed two lists that were `sort -n`-ordered emitted garbage
  quietly, because `comm` needs its inputs in the collation it compares
  with — it named 77 on-board issues as missing, some of them printed three
  lines up in the same output. Sort both sides with plain `sort`, and
  reconcile every audit count against the `gh project item-list` total
  before trusting it.
- A bare `gh issue create` does not put the new issue on the board — only
  `gh issue create --project "<title>"` does, and even then with no Status.
  Otherwise the issue stays off the board until
  `gh project item-add 1 --owner <owner> --url <url>`, and either way it
  needs `gh project item-edit` to set Status; eleven open issues had
  drifted off the board this way. Anything that files an issue and then
  calls it "on the board" without one of those steps is reporting a state
  that is not there.
- Prefer issues that deliver something a person can see over issues that
  deliver only an enabling layer. A storage-only or schema-only ticket can be
  verified through unit tests or devtools but never by using the app, so it
  banks unverified behavior and defers every real signal to a later ticket.
  When you triage or draft one, fold the enabling layer into the first ticket
  that shows something, leaving a follow-up for the richer view. Watch for the
  inverse smell too: a display ticket that silently assumes a store nobody
  built.
