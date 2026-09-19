import {
  analysisOf,
  drilledThrough,
  freshHarness,
} from "./usePracticeDrill.test.common";
import { describe, expect, it } from "@jest/globals";
import { mockItemA } from "../ui/mistakeQueue.test.common";
import { suitPermutationForView } from "../game/suitPermutation";

const SCORED = analysisOf(false, 0.5);

describe("what a drill tells the tally the board is showing", () => {
  /*
   * What the tally needs to key the attempt by the mistake being practiced
   * rather than by the relabeled cards the player is looking at (#809). It
   * must be the same renaming the board itself was built from, or the tally
   * would undo a renaming nobody applied.
   */
  it("is the relabeling this view of the drilled hand was built from", () => {
    const harness = drilledThrough(SCORED);

    expect(harness.forwardedRelabelings.at(-1)).toStrictEqual(
      suitPermutationForView(mockItemA.cards, mockItemA.handKey, 0),
    );
  });

  it("is nothing at all when no drill holds the board", () => {
    const harness = freshHarness({ seed: true });

    harness.render(SCORED);

    expect(harness.forwardedRelabelings).toStrictEqual([null]);
  });
});
