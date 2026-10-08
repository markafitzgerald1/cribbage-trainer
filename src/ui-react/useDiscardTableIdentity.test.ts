/* jscpd:ignore-start */
import {
  HAND,
  OTHER_HAND,
  handOf,
  noteOrigin,
  renderTallyWithMutableCards,
} from "./useDiscardTally.test.common";
import { describe, expect, it } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import { act } from "@testing-library/react";
import { readTallyForDisplay } from "../ui/discardTally";

const identityA = {
  crib: { means_sha256: "a".repeat(64) },
  play: { means_sha256: "b".repeat(64) },
};
const identityB = {
  crib: identityA.crib,
  play: { means_sha256: "c".repeat(64) },
};
const analysis = {
  cribRole: CribRole.Dealer,
  quality: { expectedPointsLoss: 2, isOptimal: false },
};

describe("analysis table identity capture", () => {
  it("keeps identityA for a repeated hand scored under identityB and stamps a new decision with identityB", () => {
    const hook = renderTallyWithMutableCards(handOf(HAND));
    act(() =>
      hook.result.current.reportAnalysisRendered(analysis, null, identityA),
    );
    act(() =>
      hook.result.current.reportAnalysisRendered(
        { ...analysis, quality: { expectedPointsLoss: 1, isOptimal: false } },
        null,
        identityB,
      ),
    );

    expect(readTallyForDisplay().records).toHaveLength(1);
    expect(readTallyForDisplay().records[0]).toMatchObject({
      expectedPointsLoss: 2,
      tableIdentity: identityA,
    });

    noteOrigin(hook.result.current, OTHER_HAND, "deal");
    hook.rerender({ dealtCards: handOf(OTHER_HAND) });
    act(() =>
      hook.result.current.reportAnalysisRendered(analysis, null, identityB),
    );

    expect(readTallyForDisplay().records[1]?.tableIdentity).toStrictEqual(
      identityB,
    );
  });

  it("leaves absent analysis provenance unknown after a score actually arrived", () => {
    const hook = renderTallyWithMutableCards(handOf(HAND));
    act(() => hook.result.current.reportAnalysisRendered(analysis, null));

    expect(readTallyForDisplay().records).toHaveLength(1);
    expect(readTallyForDisplay().records[0]?.tableIdentity).toBeNull();
  });
});

/* jscpd:ignore-end */
