---
name: working-an-issue
description: Use before starting work on a GitHub issue, and when you triage or draft one — what the issue body, the plan comment, and the pull request each record, the shape an issue should have, the project board, branch and PR shape, what a review guide and testing plan owe a reader, how to request Copilot and verify it, and the adversarial review loop that has to run before a human is asked to look.
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
  does not narrate how the work went. For a user-facing feature, it records
  whether usage will be measured and, if not, why not.
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
- **One authoritative full gate per pushed head, while local adversarial
  reviews run in parallel.** `.husky/pre-commit` runs the fast
  `npm run verify:fast` filter, not the merge gate, so a landed commit is not
  validated work. Adversarial review by Codex CLI sessions (a strong model at
  high effort, for example `gpt-6.1-sol` or `gpt-6-astra`) and by other agents
  is the real review: start it on local commits as soon as they exist, in
  parallel with CI, give each reviewer a read-only brief with the findings
  already fixed, and have it prove findings with a failing test it ran. Before
  requesting a GitHub review (Copilot, or an optional `@codex review` at most
  once on the final head), wait for required CI to be green on that exact
  SHA — unless `npm run verify:fast` and `npm run docker:build-and-test-all`
  have already passed locally on that exact head, in which case the request
  may overlap CI (Mark, 2026-10-15, amending the earlier rule "request only
  when required CI is green"). Run `npm run docker:build-and-test-all` locally
  when CI cannot be that gate — unpushed work, a Docker-only reproduction — or
  to overlap a final-head GitHub review with CI. A `--no-verify` commit
  skipped `verify:fast`, not CI's gate, so just run `verify:fast` by hand
  before pushing.
- During a review fix the loop is: reproduce with a regression test that
  fails against the unfixed code, run the focused test plus `verify:fast`,
  commit, and start the next local adversarial review round on that commit
  with a read-only brief of the findings already fixed, in parallel with
  pushing so required CI runs the full gate for that SHA. Reply to and resolve
  any GitHub threads once addressed.
- The PR body carries a human review guide, a manual testing plan, and the
  review table (`reviewer`, `head reviewed`, `outcome`) recording every
  review, including local rounds that leave no trace on the PR. Run the
  adversarial review loop to a clean round on the final head, post one short
  attributed in-thread sign-off listing each reviewer, the head it reviewed,
  and the outcome, and only then ask for human review — the human's attention
  is the scarce resource here and comes last, not first.
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
- **Both automatic GitHub reviews were turned off on 2026-09-12, so any GitHub
  round is yours to request** — Copilot through the endpoint below, and
  `@codex review` (optional and off by default, at most once per pull request
  on the final head, posted as a comment with the attribution prefix) — once
  required CI is green on that head, or overlapping CI when
  `npm run verify:fast` and the Docker gate have passed locally on that exact
  head. On a quota stub, wait for the quota to recover rather than
  re-requesting into the same reply. `AGENTS.md` under GitHub PR Reviews owns
  the policy for when each is worth spending; when requesting both on the
  final head, request them on that same head rather than one after the other.
  Request Copilot with this, since `gh pr edit --add-reviewer copilot` cannot
  resolve that login:

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
- Read the body of any review or connector comment that arrives before
  claiming a review happened. Both bots can return a stub instead: Copilot
  when the requester is out of quota, Codex when its usage limits are
  reached — and a GitHub `@codex review` "Running" status comment and eyes
  reaction are not a result, so a watcher must not stop on them (a clean
  GitHub round shows as a comment containing "Didn't find any major issues"
  plus a thumbs-up reaction and may leave nothing in the reviews API).
- The adversarial review loop and the review-thread mechanics that bind every
  PR — run local CLI and agent reviews in parallel with CI, record every
  review in the PR description table, post the attributed in-thread sign-off,
  and reply to and resolve every GitHub thread — are in `AGENTS.md` under
  GitHub PR Reviews, because they apply to any PR and not only to issue work.
- **Review tiers, cheapest first, stopping when a round is clean.** (1) Local
  gates: `npm run verify:fast` and the Docker gate on the head, which catch
  lint, spelling and layout for free. (2) First adversarial round: two
  independent reviewers (for example a Claude Opus agent and a Codex CLI
  session) on a pull request over about 250 gated lines, one on a smaller
  one, each given a read-only brief that asks for mutation-proven test gaps,
  provenance and wording claims checked against the code, accessible-name
  collisions, and focus behavior. Prefer the reviewer whose plan has the most
  budget left; Opus agents cost roughly 150-200k tokens and five to seven
  minutes per round. (3) Later rounds review only the delta since the last
  round, in a brief that lists what is already fixed, and are skipped when the
  delta is wording or test assertions the gates already cover. (4) At most one
  GitHub `@codex review` on the final head, written as a plain comment with no
  other `@codex` mention in the PR text, since any such mention triggers the
  bot. Record usage before and after each round in the review table when the
  plan shows it.
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
  `gh project item-list 1 --owner <owner> --limit 1000 --format json` — the
  board passed 400 items in October 2026, so the default limit hides most of
  them and any fixed limit eventually does too: check that the returned
  count equals `.totalCount` —
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
- Those meanings imply seven board invariants, each worth checking because
  nothing enforces it: every open issue is on the board; every open issue
  has a milestone; every board item has a Status set (a `--project` add
  leaves it empty, so the item shows in no column); no `Beyond MLP` item and
  no `blocked` item sits in Todo; nothing closed sits outside Done;
  nothing still open sits in Done, where an accidental drop hides live work
  while passing every other check; and no open umbrella issue has every native
  sub-issue closed.
- Detect the seventh invariant through the native relationship: read
  `sub_issues_summary` from
  `gh api repos/<owner>/<repo>/issues/<n>`. An open issue violates it when
  `total > 0` and `completed == total`. A Markdown checklist of issue references
  is not a sub-issue relationship and reports `total: 0`, so reading the issue
  body cannot verify this invariant. #756 is currently the only umbrella in
  either repository; guarding one card with this rule is clearer than adding a
  `Tracking` Status option solely for it.
- The board has no Priority field, yet the work is still ranked: priority is
  the milestone, then the Status column, then the manual top-to-bottom order
  of cards within a column. The top of Todo is the default next issue to
  pick up — and `MLP` is the active milestone with `Beyond MLP` deferred. An
  agent that hunts for a Priority field finds none and can misread the board
  as a flat bag of work; one that treats Todo as unordered picks the wrong
  issue next. Within Todo the milestone discriminates almost nothing, since
  nearly every card there is `MLP`; the manual order is what carries the
  ranking, and `Paused` is where the milestone actually separates things.
- **Ranking a card is a GraphQL mutation; `gh project item-edit` cannot do
  it.** It sets field values and has no notion of position. The mutation is
  `updateProjectV2ItemPosition`, whose input is `projectId` (ID!), `itemId`
  (ID!) and an optional `afterId` (ID): omitting it, or passing null, moves
  the item to the top of the **whole project**. Introspect it rather than
  trusting this copy:

  ```bash
  gh api graphql --field query='
  { __type(name: "UpdateProjectV2ItemPositionInput") {
      inputFields { name description } } }'
  ```

  The project id is `gh project view 1 --owner <owner> --format json --jq .id`,
  and item ids are `.items[].id` from `gh project item-list`; so is the id
  `gh project item-add ... --format json` returns for a new card. Moving one
  card after another:

  ```bash
  gh api graphql \
    --raw-field query='mutation($p:ID!,$i:ID!,$a:ID!){
      updateProjectV2ItemPosition(
        input:{projectId:$p, itemId:$i, afterId:$a}){
        items { totalCount } } }' \
    --raw-field p=<projectId> --raw-field i=<itemId> \
    --raw-field a=<afterItemId>
  ```

- **Order is project-wide, and a column's rank is that order filtered by
  Status.** `gh project item-list 1 --owner <owner> --limit 1000 --format json`
  returns items in board order (its first hundred matched a GraphQL
  `items(first: 100)` read id for id on 2026-10-18), so a column's ranking is
  `.items` filtered on `.status`. Nothing groups the columns inside the
  project order: on 2026-10-18 Todo was sixteen cards, then one Backlog, ten
  more Todo, then In Progress and Done cards, with Todo reappearing in
  short runs throughout. Because only the relative order of cards sharing a
  Status is read as rank, the cards of other columns around a placement are
  irrelevant, and two rules cover every case:
  - to rank behind a card `X` in the same column, pass `X`'s id;
  - to rank first in a column, omit `afterId`: the top of the project
    precedes every card, so it is the top of every column whatever sits
    first today.

- **A new card's placement is four steps, and the last is a re-read.**
  `gh project item-add` leaves Status empty, so: `item-add`, then `item-edit`
  for Status, then the reorder, then `item-list` again to confirm both the
  Status and the position. The mutation answers with a count, not a
  position, so a success response does not show the card landed where you
  meant. The Status field currently has six options, **Backlog** among them,
  which the five-name list above omits; read the live ones with `field-list`.
- The reorder is GraphQL, so it fails in Claude Code on the web sessions,
  where GraphQL is blocked (`CLAUDE.md`, cloud sessions); hand the ranking to
  a local session instead of concluding the card cannot be moved.
- **`Waiting on` is a board field, and a stale one is worse than an empty
  one.** It holds the issue numbers a card is blocked by, terse — `#725`,
  `#627 + #725` — and it is populated only where a blocker is real, which
  was eleven of roughly ninety open issues when it was added on 2026-09-16.
  Most work has no blocker and an empty field is the correct answer for it.
  The failure mode is the opposite one: #764 carried "blocked by #763" in
  its body long after #763 merged, and by the time anyone checked, its own
  stated trigger had fired eleven qualifying pull requests earlier. So when
  you merge something, clear it from any `Waiting on` that names it, and
  when you find a blocker already satisfied, say so on the issue rather than
  leaving the next reader to re-derive it. Prefer the issue body as the
  place that explains _why_ something waits; the field is a scanning aid
  pointing at it, not a substitute.
- The board spans two repositories whose issue numbers are scoped
  independently, so two unrelated issues can carry the same number and meet
  on one board. A board audit must therefore key each item on the repository
  and number together, `(content.repository, content.number)`, never
  `content.number` alone.
  Project 1 tracks `cribbage-trainer` and its sibling
  `simulate-cribbage-games` together — over 400 items — and #22, #23,
  #101, and #102 each exist in both. Keying on the number alone silently
  merges them: one pass reported trainer #22 and #23 as "open but marked
  Done" when they were Todo and the Done rows belonged to the simulator,
  and it buried a real finding — a `Beyond MLP` item sitting in trainer's
  Todo — under the simulator's #22.
- Board audits fail silently in other ways, and one session shipped three
  wrong-but-well-formed answers in a row. GraphQL `items(first: 100)`
  truncated that board with no error — the first page held every Todo item
  but one, so the column looked complete while an issue hid at its tail. Use
  `gh project item-list 1 --owner <owner> --limit 1000`, the limit trap the
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
- **"How often does this happen?" is two questions, and only one of them is
  answerable from inside this repository.** A structural question — how
  often does the game put the player in a position where this can happen —
  is answered by enumerating deals with the app's own scoring, needs no
  user data, and gives a **ceiling**. A behavior question — how often
  does this player actually do it — needs recorded decisions, and those
  live in `localStorage` on the device that played them: there is no file
  here to read, and #752 (export and import of decision history) is still
  open, so there is nothing to ask for either. #824 asked the second and
  had to be answered with the first. Say in the plan comment and the pull
  request which of the two you measured and that it is a property of the
  game rather than of anyone's play; the two numbers differ by an order of
  magnitude there (a 58.10% structural ceiling against a 4.32%
  indifference density), so conflating them would have argued for the
  wrong change. Never hand-write a history sample to fill the gap, and
  never quietly skip the measurement and build anyway.
- A measured recommendation **not** to build is a complete deliverable, and
  the artifact for it is the issue, not a pull request. Where the owner has
  already voiced a suspicion that something is not worth building, the bar
  for concluding the same drops rather than rises — but the evidence still
  decides, and an owner leaning is a reason to look harder, not a reason to
  stop measuring. Post the number either way, and say plainly which parts
  of the case it does and does not support.
