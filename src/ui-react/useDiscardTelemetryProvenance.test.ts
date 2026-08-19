/* jscpd:ignore-start */
import {
  OTHER_HAND,
  type Scene,
  type SetupOptions,
  completeDiscard,
  deepLinkedOptions,
  expectLastShown,
  expectTelemetryScene,
  handStartedEvents,
  navigateHistory,
  replaceHandWith,
  shownParams,
} from "./useDiscardTelemetry.test.common";
import { describe, expect, it } from "@jest/globals";
/* jscpd:ignore-end */

// A globally unique identifier lets warehouse analysis key on deal_nonce across sessions and devices.
const UUID_PATTERN =
  /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/u;

const THIRD_HAND = "AD,2D,3D,4D,5D,6D";

const seededOptions: SetupOptions = { isSeededSession: true };

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

  // A restored entry states its own provenance, because cards cannot: a seeded deal and a later hand-entry of the same six cards share a key.
  type HistoryRestore = readonly [string, boolean | null];

  const PROVENANCE_CASES: readonly {
    readonly expected: boolean;
    readonly name: string;
    readonly options: SetupOptions;
    readonly restore?: HistoryRestore;
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
      name: "a restored entry recorded as seed-dealt",
      options: seededOptions,
      restore: [OTHER_HAND, true],
    },
    {
      expected: false,
      name: "a restored entry recorded as entered by hand",
      options: seededOptions,
      restore: [OTHER_HAND, false],
    },
    {
      expected: true,
      name: "a restored entry of a seeded session recording nothing",
      options: seededOptions,
      restore: [OTHER_HAND, null],
    },
    {
      expected: false,
      name: "a restored entry of an unseeded session recording nothing",
      options: {},
      restore: [OTHER_HAND, null],
    },
  ];

  const buildHandHistory = (
    scene: Scene,
    steps: readonly HandStep[],
    restore: HistoryRestore | null,
  ) => {
    steps.forEach(([hand, cause]) => {
      replaceHandWith(scene, hand, cause);
    });
    if (restore !== null) {
      navigateHistory(scene, [restore[0], null], restore[1]);
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
