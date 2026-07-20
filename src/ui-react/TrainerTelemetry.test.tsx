import type { AnalysisSource, TrainerEventName } from "../ui/trackEvent";
import {
  SIX_HEARTS_HAND,
  mathRandom,
  renderTrainerWithGenerator,
  renderTrainerWithInitialProps,
  setCribTable,
} from "./Trainer.test.common";
import { type TrainerProps, analyticsConsentKey } from "./Trainer";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, screen } from "@testing-library/react";
import { parseHand } from "../game/Card";

const setStoredConsent = (consent: boolean | null) => {
  if (consent === null) {
    localStorage.removeItem(analyticsConsentKey);
  } else {
    localStorage.setItem(analyticsConsentKey, JSON.stringify(consent));
  }
};

const startTelemetryCapture = (consent: boolean | null) => {
  window.history.replaceState(null, "", "/");
  setStoredConsent(consent);
  return jest.fn<TrainerProps["trackEvent"]>();
};

const setupTelemetryTrainer = (consent: boolean | null) => {
  const trackEvent = startTelemetryCapture(consent);
  const renderResult = renderTrainerWithGenerator(mathRandom, trackEvent);
  const clickCheckbox = (index: number) => {
    fireEvent.click(renderResult.getAllByRole("checkbox")[index]!);
  };
  return { clickCheckbox, trackEvent };
};

const expectLastAnalysisShown = (
  trackEvent: ReturnType<typeof startTelemetryCapture>,
  {
    analysisIndex = 1,
    isFirstAnalysis,
    source,
  }: {
    readonly analysisIndex?: number;
    readonly isFirstAnalysis: boolean;
    readonly source: AnalysisSource;
  },
) => {
  expect(trackEvent).toHaveBeenLastCalledWith(true, "analysis_shown", {
    analysisIndex,
    dealNonce: expect.any(String),
    isFirstAnalysis,
    source,
  });
};

interface CardToggleCase {
  readonly clicks: readonly number[];
  readonly consent: boolean | null;
  readonly discardCount: number;
  readonly eventName: TrainerEventName;
}

interface AnalysisSequenceCase {
  readonly afterConsent: readonly number[];
  readonly beforeConsent: readonly number[];
  readonly consent: boolean | null;
  readonly consentAction: () => void;
  readonly name: string;
}

const CARD_TOGGLE_CASES: readonly CardToggleCase[] = [
  { clicks: [0], consent: true, discardCount: 1, eventName: "card_selected" },
  {
    clicks: [0, 0],
    consent: null,
    discardCount: 0,
    eventName: "card_unselected",
  },
];

const acceptAnalyticsConsent = () => {
  fireEvent.click(screen.getByRole("button", { name: "Accept" }));
};

const keepStoredConsent = () => null;

const RAPID_ANALYSIS_CASES: readonly AnalysisSequenceCase[] = [
  {
    afterConsent: [1, 2],
    beforeConsent: [0, 1],
    consent: null,
    consentAction: acceptAnalyticsConsent,
    name: "does not reclassify a pre-consent analysis after consent",
  },
  {
    afterConsent: [0, 1, 2, 2],
    beforeConsent: [],
    consent: true,
    consentAction: keepStoredConsent,
    name: "records the first answer exposure before a rapid mind change",
  },
];

describe("trainer telemetry wiring", () => {
  it.each(CARD_TOGGLE_CASES)(
    "forwards $eventName to trackEvent with the stored $consent consent",
    ({ clicks, consent, discardCount, eventName }) => {
      const { clickCheckbox, trackEvent } = setupTelemetryTrainer(consent);
      clicks.forEach((index) => {
        clickCheckbox(index);
      });

      expect(trackEvent).toHaveBeenLastCalledWith(consent, eventName, {
        dealNonce: expect.any(String),
        discardCount,
      });
    },
  );

  it("emits deal_clicked when the Deal button is clicked", () => {
    const { trackEvent } = setupTelemetryTrainer(false);
    fireEvent.click(screen.getByRole("button", { name: "Deal" }));

    expect(trackEvent).toHaveBeenCalledWith(false, "deal_clicked", {
      dealNonce: expect.any(String),
    });
  });

  it.each(RAPID_ANALYSIS_CASES)(
    "$name",
    ({ afterConsent, beforeConsent, consent, consentAction }) => {
      const { clickCheckbox, trackEvent } = setupTelemetryTrainer(consent);
      beforeConsent.forEach(clickCheckbox);
      consentAction();
      afterConsent.forEach(clickCheckbox);

      expectLastAnalysisShown(trackEvent, {
        analysisIndex: 2,
        isFirstAnalysis: false,
        source: "interactive",
      });
    },
  );

  it("reports a popstate hydration with a history source", () => {
    const { trackEvent } = setupTelemetryTrainer(true);
    window.history.replaceState(
      null,
      "",
      `?hand=${SIX_HEARTS_HAND}&discard=AH,2H`,
    );
    fireEvent.popState(window);

    expectLastAnalysisShown(trackEvent, {
      isFirstAnalysis: false,
      source: "history",
    });
  });

  it("reports a deep-linked discard with a deeplink source", () => {
    const trackEvent = startTelemetryCapture(true);
    setCribTable();
    renderTrainerWithInitialProps({
      initialCards: parseHand(SIX_HEARTS_HAND),
      initialDiscards: parseHand("AH,2H"),
      trackEvent,
    });

    expectLastAnalysisShown(trackEvent, {
      isFirstAnalysis: false,
      source: "deeplink",
    });
  });
});
