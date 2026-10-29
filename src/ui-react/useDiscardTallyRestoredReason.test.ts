import {
  HAND,
  OTHER_HAND,
  dealAwayThenRestore,
  noteOrigin,
  noteRestore,
  renderTally,
  replacedBy,
  scopeFor,
} from "./useDiscardTally.test.common";
import { describe, expect, it } from "@jest/globals";
import type { DiscardTally } from "./useDiscardTally";

describe("uncounted reason across history", () => {
  it.each([
    {
      name: "a restored hand whose first reason was a link",
      reason: "restored",
      start: () => renderTally(HAND, { wasDeepLinked: true }),
      steps: (tally: DiscardTally) => {
        noteRestore(tally, OTHER_HAND, { handId: "never-filed-scope" });
      },
    },
    {
      name: "a dealt hand reached by Back",
      reason: "restored",
      start: () => renderTally(HAND, { discarded: false }),
      steps: (tally: DiscardTally) => {
        dealAwayThenRestore(tally, HAND, "earlier-scope");
      },
    },
    {
      name: "the same cards re-entered, then the original occurrence restored",
      reason: "restored",
      start: () => renderTally(HAND),
      steps: (tally: DiscardTally) => {
        noteOrigin(tally, OTHER_HAND, "deal");
        noteOrigin(tally, HAND, "manual");
        noteOrigin(tally, OTHER_HAND, "deal");
        noteRestore(tally, HAND, { handId: scopeFor("original") });
      },
    },
    {
      name: "a counting hand whose sort alone is restored",
      reason: null,
      start: () => renderTally(HAND),
      steps: (tally: DiscardTally) => {
        dealAwayThenRestore(tally, OTHER_HAND, scopeFor(OTHER_HAND));
      },
    },
    {
      name: "a deal after entered cards",
      reason: null,
      start: () => replacedBy(OTHER_HAND, "manual"),
      steps: (tally: DiscardTally) => {
        noteOrigin(tally, HAND, "deal");
      },
    },
  ])("names $reason for $name", ({ reason, start, steps }) => {
    const { result } = start();
    steps(result.current);

    expect(result.current.uncountedReason).toBe(reason);
  });
});
