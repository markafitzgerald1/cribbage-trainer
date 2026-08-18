/* jscpd:ignore-start */
import {
  HAND,
  OTHER_HAND,
  type Scene,
  type SetupOptions,
  THIRD_HAND,
  completeDiscard,
  deepLinkedOptions,
  expectLastShown,
  expectTelemetryScene,
  handStartedEvents,
  navigateHistory,
  replaceHandWith,
  seededOptions,
  shownParams,
} from "./useDiscardTelemetry.test.common";
import { describe, expect, it } from "@jest/globals";
/* jscpd:ignore-end */

// A globally unique identifier lets warehouse analysis key on deal_nonce across sessions and devices.
const UUID_PATTERN =
  /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/u;

describe("telemetry hand identity and provenance", () => {
  it("identifies the hand with a random UUID", () => {
    expectTelemetryScene({}, (scene) => {
      expect(handStartedEvents(scene)[0]?.dealNonce).toMatch(UUID_PATTERN);
    });
  });

  it("stamps the analysis of a seeded hand with its provenance", () => {
    expectTelemetryScene(seededOptions, (scene) => {
      completeDiscard(scene, "AH,2H");

      expectLastShown(scene, {
        ...shownParams(1, true, "interactive"),
        generatedFromSeed: true,
      });
    });
  });

  type HandStep = readonly [string, "deal" | "manual"];

  // Provenance follows the cards, not the URL: a seeded session keeps dealing seeded hands around hands it did not generate, and history restores whatever the hand was when this session created it.
  const PROVENANCE_CASES: readonly {
    readonly expected: boolean;
    readonly name: string;
    readonly options: SetupOptions;
    readonly restore?: string;
    readonly steps?: readonly HandStep[];
  }[] = [
    {
      expected: true,
      name: "the initial hand of a seeded session",
      options: seededOptions,
    },
    {
      expected: false,
      name: "the initial hand of an unseeded session",
      options: {},
    },
    {
      expected: false,
      name: "a deep-linked hand under a seeded URL",
      options: { ...deepLinkedOptions, ...seededOptions },
    },
    {
      expected: true,
      name: "a dealt hand",
      options: seededOptions,
      steps: [[OTHER_HAND, "deal"]],
    },
    {
      expected: false,
      name: "a hand entered under a seeded URL",
      options: seededOptions,
      steps: [[OTHER_HAND, "manual"]],
    },
    {
      expected: true,
      name: "a hand dealt after an entered one",
      options: seededOptions,
      steps: [
        [OTHER_HAND, "manual"],
        [THIRD_HAND, "deal"],
      ],
    },
    {
      expected: true,
      name: "a restored hand the seed dealt",
      options: seededOptions,
      restore: HAND,
      steps: [[OTHER_HAND, "deal"]],
    },
    {
      expected: false,
      name: "a restored hand the user re-entered after the seed dealt it",
      options: seededOptions,
      restore: HAND,
      steps: [
        [OTHER_HAND, "deal"],
        [HAND, "manual"],
        [THIRD_HAND, "deal"],
      ],
    },
    {
      expected: false,
      name: "a restored hand this session never created",
      options: seededOptions,
      restore: THIRD_HAND,
      steps: [[OTHER_HAND, "deal"]],
    },
    {
      expected: false,
      name: "a restored hand the seed never dealt",
      options: seededOptions,
      restore: OTHER_HAND,
      steps: [
        [OTHER_HAND, "manual"],
        [THIRD_HAND, "deal"],
      ],
    },
  ];

  const buildHandHistory = (
    scene: Scene,
    steps: readonly HandStep[],
    restore: string | null,
  ) => {
    steps.forEach(([hand, cause]) => {
      replaceHandWith(scene, hand, cause);
    });
    if (restore !== null) {
      navigateHistory(scene, restore, null);
    }
  };

  it.each(PROVENANCE_CASES)(
    "reports $name as generated from a seed: $expected",
    ({ expected, options, restore = null, steps = [] }) => {
      expectTelemetryScene(options, (scene) => {
        buildHandHistory(scene, steps, restore);

        expect(handStartedEvents(scene).at(-1)?.generatedFromSeed).toBe(
          expected,
        );
      });
    },
  );
});
