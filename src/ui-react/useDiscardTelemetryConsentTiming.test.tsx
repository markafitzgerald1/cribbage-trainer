import { type ReactNode, useState } from "react";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react";
import { AnalysisReporter } from "./useDiscardTelemetryConsentTiming.test.common";
import { CribRole } from "../game/expectedCribPoints";
import type { TrackEvent } from "../ui/trackEvent";
import { parseHand } from "../game/Card";
import { toDealtCards } from "../game/toDealtCards";
import { useDiscardTelemetry } from "./useDiscardTelemetry";

const HAND = "AH,2H,3H,4H,5H,6H";
const DISCARD = "AH,2H";

const RENDERED_ANALYSIS = {
  cribRole: CribRole.Dealer,
  quality: { expectedPointsLoss: 1.25, isOptimal: false },
};

/*
 * One click flips consent and re-runs the child's effect in the same commit,
 * which is the withdrawal the trainer commits together with the analysis
 * whose tables had not finished loading until that moment.
 */
function WithdrawalHarness({
  trackEvent,
}: {
  readonly trackEvent: TrackEvent;
}): ReactNode {
  const [consented, setConsented] = useState(true);
  const [renderCount, setRenderCount] = useState(0);
  const telemetry = useDiscardTelemetry({
    consented,
    dealtCards: toDealtCards(parseHand(HAND), null),
    decisionQualityConsented: consented,
    isSeededSession: false,
    trackEvent,
    wasDeepLinked: false,
  });
  return (
    <>
      <button
        onClick={() => {
          telemetry.reportCardToggled(
            toDealtCards(parseHand(HAND), parseHand(DISCARD)),
            false,
          );
        }}
        type="button"
      >
        Choose discard
      </button>
      <button
        onClick={() => {
          setConsented(false);
          setRenderCount(1);
        }}
        type="button"
      >
        Withdraw and render
      </button>
      <AnalysisReporter
        onRendered={() => {
          telemetry.reportAnalysisRendered(RENDERED_ANALYSIS);
        }}
        renderCount={renderCount}
      />
    </>
  );
}

describe("useDiscardTelemetry consent timing", () => {
  it("withholds a score from a withdrawal committed with the render", () => {
    const trackEvent = jest.fn<TrackEvent>();
    render(<WithdrawalHarness trackEvent={trackEvent} />);

    fireEvent.click(screen.getByText("Choose discard"));
    fireEvent.click(screen.getByText("Withdraw and render"));

    expect(
      trackEvent.mock.calls
        .filter(([, eventName]) => eventName === "discard_scored")
        .map(([consented]) => consented),
    ).toStrictEqual([false]);
  });
});
