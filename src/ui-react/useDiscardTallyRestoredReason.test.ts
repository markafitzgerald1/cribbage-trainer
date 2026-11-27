/* jscpd:ignore-start */
import {
  DEFAULT_SORT_ORDER,
  HAND,
  INITIAL_HAND_ID,
  OTHER_HAND,
  dealAwayThenRestore,
  decisionsAndSkips,
  handOf,
  noteOrigin,
  noteRestore,
  renderTally,
  renderTallyWithMutableCards,
  replacedBy,
  reportScore,
  scopeFor,
} from "./useDiscardTally.test.common";
import { asJson, storeRaw, storedWith } from "../ui/discardTally.test.common";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import type { DiscardTally } from "./useDiscardTally";
import { SortOrder } from "../ui/SortOrder";
import { parseHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";
/* jscpd:ignore-end */

describe("uncounted reason across history", () => {
  it.each([
    {
      name: "another hand restored after a page opened by link",
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

const otherDiscardOfHand = () =>
  toDealtCards(parseHand(HAND), parseHand("3H,4H"));

type MutableHarness = ReturnType<typeof renderTallyWithMutableCards>;

const rerenderBoard = (
  harness: MutableHarness,
  dealtCards: ReturnType<typeof handOf>,
  {
    handId = INITIAL_HAND_ID,
    sortOrder = DEFAULT_SORT_ORDER,
  }: { readonly handId?: string; readonly sortOrder?: SortOrder } = {},
) => {
  harness.rerender({ dealtCards, handId, sortOrder });
};

const startScored = (wasDeepLinked = false): MutableHarness => {
  const harness = renderTallyWithMutableCards(
    handOf(HAND, true),
    DEFAULT_SORT_ORDER,
    wasDeepLinked,
  );
  reportScore(harness.result.current);
  return harness;
};

const rerenderOtherHand = (harness: MutableHarness, discarded = false) => {
  rerenderBoard(harness, handOf(OTHER_HAND, discarded), {
    handId: scopeFor(OTHER_HAND),
  });
};

const withdrawCard = (harness: MutableHarness) => {
  rerenderBoard(harness, handOf(HAND, false));
  return harness;
};

const scoreAndRevise = (wasDeepLinked = false): MutableHarness =>
  withdrawCard(startScored(wasDeepLinked));

const replaceAfterRevise = (cause: "deal" | "manual") => {
  const harness = scoreAndRevise();
  noteOrigin(harness.result.current, OTHER_HAND, cause);
  rerenderOtherHand(harness);
  return harness;
};

const reviseToPair = (dealtCards: ReturnType<typeof handOf>) => {
  const harness = scoreAndRevise();
  rerenderBoard(harness, dealtCards);
  reportScore(harness.result.current);
  return harness;
};

const withdrawUnknownOrigin = () => {
  const harness = renderTallyWithMutableCards(handOf(HAND, true));
  noteRestore(harness.result.current, OTHER_HAND, {
    cribRole: null,
    handId: scopeFor(OTHER_HAND),
  });
  rerenderOtherHand(harness, true);
  reportScore(harness.result.current);
  rerenderOtherHand(harness, false);
  return harness;
};

const restoreSameHand = (discarded: boolean, sortOrder: SortOrder) => {
  const harness = startScored();
  noteRestore(harness.result.current, HAND);
  rerenderBoard(harness, handOf(HAND, discarded), { sortOrder });
  return harness;
};

const reviseOverNewerBuild = () => {
  const harness = renderTallyWithMutableCards(handOf(HAND, true));
  storeRaw(asJson(storedWith({ version: 9 })));
  reportScore(harness.result.current);
  return withdrawCard(harness);
};

const reviseRepeatDeal = () => {
  const harness = startScored();
  noteOrigin(harness.result.current, OTHER_HAND, "deal");
  rerenderOtherHand(harness);
  noteOrigin(harness.result.current, HAND, "deal");
  rerenderBoard(harness, handOf(HAND, true), { handId: "repeat-deal-scope" });
  reportScore(harness.result.current);
  rerenderBoard(harness, handOf(HAND, false), {
    handId: "repeat-deal-scope",
  });
  return harness;
};

describe("revised discard note on counted hands", () => {
  it.each([
    {
      expected: null,
      name: "stays quiet on the first counted discard itself",
      run: () => startScored(),
    },
    {
      expected: null,
      name: "stays quiet when sorting or re-reporting the counted discard",
      run: () => {
        const harness = startScored();
        rerenderBoard(harness, handOf(HAND, true), {
          sortOrder: SortOrder.Ascending,
        });
        reportScore(harness.result.current);
        return harness;
      },
    },
    {
      expected: null,
      name: "stays quiet when withdrawing a card before any discard is scored",
      run: () => {
        const harness = renderTallyWithMutableCards(handOf(HAND, true));
        reportScore(harness.result.current, {
          cribRole: CribRole.Dealer,
          quality: null,
        });
        return withdrawCard(harness);
      },
    },
    {
      expected: "revised",
      name: "shows revised after withdrawing a card from a counted discard",
      run: () => scoreAndRevise(),
    },
    {
      expected: "revised",
      name: "stays revised when selecting a different discard pair",
      run: () => reviseToPair(otherDiscardOfHand()),
    },
    {
      expected: "revised",
      name: "stays revised when re-selecting the original counted discard pair",
      run: () => reviseToPair(handOf(HAND, true)),
    },
    {
      expected: null,
      name: "stays quiet when withdrawing on a hand of unknown origin",
      run: withdrawUnknownOrigin,
    },
    {
      expected: null,
      name: "clears when a new hand is dealt",
      run: () => replaceAfterRevise("deal"),
    },
    {
      expected: null,
      name: "clears when board handId changes directly",
      run: () => {
        const harness = scoreAndRevise();
        rerenderOtherHand(harness);
        return harness;
      },
    },
    {
      expected: "entered",
      name: "replaces the note with entered when cards are entered manually",
      run: () => replaceAfterRevise("manual"),
    },
    {
      expected: "restored",
      name: "replaces the note with restored on a cross-hand restore",
      run: () => {
        const harness = scoreAndRevise();
        noteRestore(harness.result.current, OTHER_HAND, {
          handId: scopeFor(OTHER_HAND),
        });
        rerenderOtherHand(harness, true);
        return harness;
      },
    },
    {
      expected: "linked",
      name: "keeps linked when withdrawing on a deep-linked hand",
      run: () => scoreAndRevise(true),
    },
    {
      expected: "entered",
      name: "keeps entered when withdrawing on a manually entered hand",
      run: () => {
        const harness = renderTallyWithMutableCards(handOf(HAND, true));
        noteOrigin(harness.result.current, HAND, "manual");
        reportScore(harness.result.current);
        return withdrawCard(harness);
      },
    },
    {
      expected: null,
      name: "stays quiet on a same-hand restore of the counted discard",
      run: () => restoreSameHand(true, SortOrder.Ascending),
    },
    {
      expected: "revised",
      name: "shows revised on a same-hand restore to an undecided state",
      run: () => restoreSameHand(false, DEFAULT_SORT_ORDER),
    },
    {
      expected: null,
      name: "stays quiet when a newer-build tally refuses the discard",
      run: reviseOverNewerBuild,
    },
    {
      expected: null,
      name: "stays quiet when a newly dealt hand already has an authentic record",
      run: reviseRepeatDeal,
    },
  ])("$name", ({ expected, run }) => {
    const { result } = run();

    expect(result.current.uncountedReason).toBe(expected);
  });

  it.each([
    {
      expected: [1, 0],
      name: "counts only the first discard when a revised pair is scored",
      run: () => reviseToPair(otherDiscardOfHand()),
    },
    {
      expected: [0, 0],
      name: "records nothing when a newer-build tally refuses the first discard",
      run: reviseOverNewerBuild,
    },
  ])("$name", ({ expected, run }) => {
    run();

    expect(decisionsAndSkips()).toStrictEqual(expected);
  });
});
