/* jscpd:ignore-start */
import {
  type Scene,
  completeDiscard,
  expectTelemetryScene,
  renderAnalysisOnScreen,
  scoredEvents,
  scoredParams,
  toggleTo,
} from "./useDiscardTelemetry.test.common";
import { describe, expect, it } from "@jest/globals";
/* jscpd:ignore-end */

const scoredConsents = (scene: Scene) =>
  scene.trackEvent.mock.calls
    .filter(([, eventName]) => eventName === "discard_scored")
    .map(([consented]) => consented);

const scoreFirstDiscard = (scene: Scene) => {
  completeDiscard(scene, "AH,2H");
  renderAnalysisOnScreen(scene);
};

describe("useDiscardTelemetry decision quality", () => {
  it("scores the discard the exposure that revealed it belongs to", () => {
    expectTelemetryScene({}, (scene) => {
      scoreFirstDiscard(scene);

      expect(scoredEvents(scene)).toStrictEqual([
        scoredParams(1, true, "interactive"),
      ]);
    });
  });

  // An exposure the user saw more than once is still one decision.
  it("scores an exposure once however often its results render", () => {
    expectTelemetryScene({}, (scene) => {
      scoreFirstDiscard(scene);
      renderAnalysisOnScreen(scene);

      expect(scoredEvents(scene)).toHaveLength(1);
    });
  });

  // The answers were on screen before this discard existed, which is what informed it.
  it("scores a later discard of the same hand as informed", () => {
    expectTelemetryScene({}, (scene) => {
      scoreFirstDiscard(scene);
      toggleTo(scene, "AH,3H");
      renderAnalysisOnScreen(scene);

      expect(scoredEvents(scene).at(-1)).toStrictEqual(
        scoredParams(2, false, "interactive"),
      );
    });
  });

  // On a first render the results reach the screen before the effect that reports the exposure, so the score waits for the exposure it belongs to.
  it("holds a score reported before its exposure exists", () => {
    expectTelemetryScene({}, (scene) => {
      renderAnalysisOnScreen(scene);
      completeDiscard(scene, "AH,2H");

      expect(scoredEvents(scene)).toStrictEqual([
        scoredParams(1, false, "interactive"),
      ]);
    });
  });

  it("sends no score for an analysis of an incomplete discard", () => {
    expectTelemetryScene({}, (scene) => {
      toggleTo(scene, "AH");
      renderAnalysisOnScreen(scene, null);

      expect(scoredEvents(scene)).toHaveLength(0);
    });
  });

  // Analytics consent given under an earlier policy keeps its own events flowing while the collection that policy never described stays off the wire.
  it("withholds the score while only the policy update is unanswered", () => {
    expectTelemetryScene(
      { consented: true, decisionQualityConsented: false },
      (scene) => {
        scoreFirstDiscard(scene);

        expect(scoredConsents(scene)).toStrictEqual([false]);
        expect(
          scene.trackEvent.mock.calls.map(([consented]) => consented),
        ).toContain(true);
      },
    );
  });

  it("scores a hand the seed generated as seed-derived practice data", () => {
    expectTelemetryScene({ isSeededSession: true }, (scene) => {
      scoreFirstDiscard(scene);

      expect(scoredEvents(scene).at(-1)).toStrictEqual({
        ...scoredParams(1, true, "interactive"),
        generatedFromSeed: true,
      });
    });
  });
});
