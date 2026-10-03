/* jscpd:ignore-start */
import { clearDiscardTally, recordDiscardDecision } from "../ui/discardTally";
import {
  clickIndices,
  renderTrainerWithInitialProps,
  setAnalysisTables,
} from "./Trainer.test.common";
import { describe, expect, it, jest } from "@jest/globals";
import { CribRole } from "../game/expectedCribPoints";
import { WITHIN_NOISE_RECORD } from "../ui/noiseVerdicts.test.common";
import { parseHand } from "../game/Card";
import { shippedCribUncertainty } from "../game/cribUncertaintyLoader";
import userEvent from "@testing-library/user-event";
import { waitFor } from "@testing-library/react";
/* jscpd:ignore-end */

const WAIT = { timeout: 8000 };

/*
 * A returning player's history holds a decision the noise check would judge,
 * so the tally view has a reason to load the sidecars from the first render.
 * Returns the crib sidecar's load count with the tally on screen and no
 * recommendation yet, then once a discard has put one there (#774).
 */
const sidecarLoadsBeforeAndAfterTheFirstRecommendation = async () => {
  setAnalysisTables();
  clearDiscardTally();
  recordDiscardDecision(WITHIN_NOISE_RECORD);
  const load = jest.spyOn(shippedCribUncertainty, "loadUncertainty");
  try {
    const user = userEvent.setup();
    const view = renderTrainerWithInitialProps({
      initialCards: parseHand("4H,5D,KH,6H,8C,KC"),
      initialCribRole: CribRole.Dealer,
    });
    await view.findByText("Lost per discard", {}, WAIT);
    const before = load.mock.calls.length;
    await clickIndices(view.getAllByRole, [0, 1], user);
    await view.findByRole("table", {}, WAIT);
    await waitFor(() => {
      expect(load).toHaveBeenCalledWith();
    }, WAIT);
    return before;
  } finally {
    load.mockRestore();
  }
};

describe("trainer history noise judging (#774)", () => {
  it("loads no uncertainty sidecar for the history until a recommendation is on screen", async () => {
    await expect(
      sidecarLoadsBeforeAndAfterTheFirstRecommendation(),
    ).resolves.toBe(0);
  });
});
