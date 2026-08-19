/* jscpd:ignore-start */
import {
  analyticsConsentKey,
  storePolicyUpdateDecline,
} from "../ui/analyticsConsent";
import { describe, expect, it } from "@jest/globals";
import {
  eventCalls,
  mathRandom,
  renderTrainerWithGenerator,
  startTelemetryCapture,
} from "./Trainer.test.common";
import { fireEvent, screen } from "@testing-library/react";
/* jscpd:ignore-end */

const POLICY_UPDATE_HEADING = "Analytics Consent Update";

// A browser that accepted the policy in force before decision-quality collection existed.
const renderWithEarlierChoice = (consent: boolean, declineUpdate = false) => {
  const trackEvent = startTelemetryCapture(null);
  localStorage.setItem(analyticsConsentKey, JSON.stringify(consent));
  if (declineUpdate) {
    storePolicyUpdateDecline();
  }
  const renderResult = renderTrainerWithGenerator(mathRandom, trackEvent);
  return {
    completeDiscard: () => {
      [0, 1].forEach((index) => {
        fireEvent.click(renderResult.getAllByRole("checkbox")[index]!);
      });
    },
    trackEvent,
  };
};

const clickButton = (name: string) => {
  fireEvent.click(screen.getByRole("button", { name }));
};

const scoredConsents = (trackEvent: ReturnType<typeof startTelemetryCapture>) =>
  eventCalls(trackEvent, "discard_scored").map(([consented]) => consented);

const scoredConsentsAfterDiscard = ({
  completeDiscard,
  trackEvent,
}: ReturnType<typeof renderWithEarlierChoice>) => {
  completeDiscard();
  return scoredConsents(trackEvent);
};

const cardConsents = (trackEvent: ReturnType<typeof startTelemetryCapture>) =>
  eventCalls(trackEvent, "card_selected").map(([consented]) => consented);

describe("analytics policy update", () => {
  it("asks again when the stored choice predates the current policy", () => {
    renderWithEarlierChoice(true);

    expect(screen.getByText(POLICY_UPDATE_HEADING)).toBeTruthy();
  });

  it("sends decision-quality events once the update is accepted", () => {
    const trainer = renderWithEarlierChoice(true);

    clickButton("Accept");

    expect(scoredConsentsAfterDiscard(trainer)).toStrictEqual([true]);
  });

  // The events disclosed by the earlier policy keep flowing under the consent already given to it.
  it("keeps analytics running and the new measurement off when declined", () => {
    const { completeDiscard, trackEvent } = renderWithEarlierChoice(true);

    clickButton("Decline");
    completeDiscard();

    expect(localStorage.getItem(analyticsConsentKey)).toBe("true");
    expect(cardConsents(trackEvent)).toStrictEqual([true, true]);
    expect(scoredConsents(trackEvent)).toStrictEqual([false]);
  });

  // The addition lives inside analytics, which a declined browser has already refused, and an Accept here would turn analytics itself back on.
  it("asks a browser that declined analytics nothing", () => {
    renderWithEarlierChoice(false);

    expect(screen.queryByText(POLICY_UPDATE_HEADING)).toBeNull();
  });

  it("stops asking once the update has been declined", () => {
    renderWithEarlierChoice(true, true);

    expect(screen.queryByText(POLICY_UPDATE_HEADING)).toBeNull();
  });

  it("turns the declined measurement on again from analytics settings", () => {
    const trainer = renderWithEarlierChoice(true, true);

    clickButton("Analytics Settings");
    clickButton("Allow decision-quality measurements");

    expect(scoredConsentsAfterDiscard(trainer)).toStrictEqual([true]);
  });
});
