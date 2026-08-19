/* jscpd:ignore-start */
import {
  OTHER_HAND,
  type Scene,
  completeDiscard,
  entryForCurrentHand,
  expectTelemetryScene,
  navigateHistory,
  renderAnalysisOnScreen,
  replaceHandWith,
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

const lastScore = (scene: Scene) => scoredEvents(scene).at(-1);

const FIRST_INTERACTIVE_SCORE = scoredParams(1, true, "interactive");

describe("useDiscardTelemetry decision quality", () => {
  it("scores the discard the exposure that revealed it belongs to", () => {
    expectTelemetryScene({}, (scene) => {
      scoreFirstDiscard(scene);

      expect(scoredEvents(scene)).toStrictEqual([FIRST_INTERACTIVE_SCORE]);
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

      expect(lastScore(scene)).toStrictEqual(
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

  /*
   * A typed-in hand reaches its first discard looking exactly like a dealt
   * one — unaided, unseeded, interactive — so without the hand's own
   * provenance the row would join population statistics that the filtering
   * contract keeps it out of.
   */
  it("scores a typed-in hand as the practice data it is", () => {
    expectTelemetryScene({}, (scene) => {
      replaceHandWith(scene, OTHER_HAND, "manual");
      toggleTo(scene, "AH,2H");
      renderAnalysisOnScreen(scene);

      expect(lastScore(scene)).toStrictEqual({
        ...FIRST_INTERACTIVE_SCORE,
        handStartSource: "manual",
      });
    });
  });

  // The exposure and its score are one decision, so a history move onto the discard already shown must not make them disagree about where it came from.
  it("scores an exposure with the source it was opened under", () => {
    expectTelemetryScene({}, (scene) => {
      completeDiscard(scene, "AH,2H");
      navigateHistory(
        scene,
        ["AH,2H,3H,4H,5H,6H", "AH,2H"],
        entryForCurrentHand(scene),
      );
      renderAnalysisOnScreen(scene);

      expect(lastScore(scene)).toStrictEqual(FIRST_INTERACTIVE_SCORE);
    });
  });

  it("scores a hand the seed generated as seed-derived practice data", () => {
    expectTelemetryScene({ isSeededSession: true }, (scene) => {
      scoreFirstDiscard(scene);

      expect(lastScore(scene)).toStrictEqual({
        ...FIRST_INTERACTIVE_SCORE,
        generatedFromSeed: true,
      });
    });
  });
});
