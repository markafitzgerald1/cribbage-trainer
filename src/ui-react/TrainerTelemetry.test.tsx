import type { AnalysisSource, TrainerEventName } from "../ui/trackEvent";
import {
  SIX_HEARTS_HAND,
  mathRandom,
  renderTrainerWithGenerator,
  renderTrainerWithInitialProps,
  setCribTable,
} from "./Trainer.test.common";
import { type TrainerProps, analyticsConsentKey } from "./Trainer";
import { act, fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, jest } from "@jest/globals";
import { ANALYSIS_SETTLE_MS } from "./useDiscardTelemetry";
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
  jest.useFakeTimers();
  return jest.fn<TrainerProps["trackEvent"]>();
};

const settle = () => {
  act(() => {
    jest.advanceTimersByTime(ANALYSIS_SETTLE_MS);
  });
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
  isFirstAnalysis: boolean,
  source: AnalysisSource,
) => {
  expect(trackEvent).toHaveBeenLastCalledWith(true, "analysis_shown", {
    analysisIndex: 1,
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

const CARD_TOGGLE_CASES: readonly CardToggleCase[] = [
  { clicks: [0], consent: true, discardCount: 1, eventName: "card_selected" },
  {
    clicks: [0, 0],
    consent: null,
    discardCount: 0,
    eventName: "card_unselected",
  },
];

describe("trainer telemetry wiring", () => {
  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it.each(CARD_TOGGLE_CASES)(
    "forwards $eventName to trackEvent with the stored $consent consent",
    ({ clicks, consent, discardCount, eventName }) => {
      const { clickCheckbox, trackEvent } = setupTelemetryTrainer(consent);
      try {
        clicks.forEach((index) => {
          clickCheckbox(index);
        });

        expect(trackEvent).toHaveBeenLastCalledWith(consent, eventName, {
          dealNonce: expect.any(String),
          discardCount,
        });
      } finally {
        jest.useRealTimers();
      }
    },
  );

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it("emits deal_clicked when the Deal button is clicked", () => {
    const { trackEvent } = setupTelemetryTrainer(false);
    try {
      fireEvent.click(screen.getByRole("button", { name: "Deal" }));

      expect(trackEvent).toHaveBeenCalledWith(false, "deal_clicked", {
        dealNonce: expect.any(String),
      });
    } finally {
      jest.useRealTimers();
    }
  });

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it("emits a first interactive analysis with consent granted mid-deal", () => {
    const { clickCheckbox, trackEvent } = setupTelemetryTrainer(null);
    try {
      clickCheckbox(0);
      clickCheckbox(1);
      fireEvent.click(screen.getByRole("button", { name: "Accept" }));
      settle();

      expectLastAnalysisShown(trackEvent, true, "interactive");
    } finally {
      jest.useRealTimers();
    }
  });

  it("keeps a mind-change flicker's analysis interactive and first", () => {
    const { clickCheckbox, trackEvent } = setupTelemetryTrainer(true);
    try {
      clickCheckbox(0);
      clickCheckbox(1);
      clickCheckbox(2);
      clickCheckbox(2);
      settle();
    } finally {
      jest.useRealTimers();
    }

    expectLastAnalysisShown(trackEvent, true, "interactive");
  });

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it("reports a popstate hydration with a history source", () => {
    const { trackEvent } = setupTelemetryTrainer(true);
    try {
      window.history.replaceState(
        null,
        "",
        `?hand=${SIX_HEARTS_HAND}&discard=AH,2H`,
      );
      fireEvent.popState(window);
      settle();

      expectLastAnalysisShown(trackEvent, false, "history");
    } finally {
      jest.useRealTimers();
    }
  });

  // eslint-disable-next-line jest/prefer-ending-with-an-expect
  it("reports a deep-linked discard with a deeplink source", () => {
    const trackEvent = startTelemetryCapture(true);
    setCribTable();
    renderTrainerWithInitialProps({
      initialCards: parseHand(SIX_HEARTS_HAND),
      initialDiscards: parseHand("AH,2H"),
      trackEvent,
    });
    try {
      settle();

      expectLastAnalysisShown(trackEvent, false, "deeplink");
    } finally {
      jest.useRealTimers();
    }
  });
});
