/* jscpd:ignore-start */
import {
  CANONICAL_PLAY_HAND_KEYS,
  PLAY_UNCERTAINTY_CONTRACT,
  playRecordIdentity,
} from "./playUncertainty";
import {
  PLAY_IDENTITY,
  type RejectionCase,
  mutatedDocument,
  parsedOrThrow,
  setHeader,
  setRecordAt,
  validPlayDocument,
} from "./uncertaintySidecar.test.common";
import { describe, expect, it } from "@jest/globals";
import {
  parseUncertaintySidecar,
  uncertaintyStandardError,
} from "./uncertaintySidecar";
import { CribRole } from "./expectedCribPoints";
import { normalizePlayHandKey } from "./expectedPlayPoints";
import { parseHand } from "./Card";
import playTableData from "./expectedPlayPointsTable.json";
import shippedSidecar from "./expectedPlayPointsUncertainty.json";
/* jscpd:ignore-end */

const SHIPPED_HAND = "5H,5S,5D,JC";
const SHIPPED_HAND_KEY = "5_5_5_J";
const PUBLISHED_HAND_COUNT = 1820;

/*
 * What version 1 pins for play alone. Everything the two sidecars share is
 * asserted against both contracts in uncertaintySidecar.test.ts. Play's rank
 * list is published empty, so the malformation that proves the check runs is
 * the opposite of crib's.
 */
const PLAY_REJECTIONS: readonly RejectionCase[] = [
  {
    mutate: setHeader("ranks", ["A"]),
    name: "a rank list where version 1 publishes none",
  },
  {
    mutate: setHeader("slots", ["delta", "total"]),
    name: "a second slot beside the delta",
  },
  {
    mutate: setHeader("provenance", { policy_fingerprint: "fingerprint" }),
    name: "provenance that does not say whether the policy converged",
  },
  {
    mutate: setHeader("provenance", { joint_policy_converged: false }),
    name: "provenance naming no policy fingerprint",
  },
  {
    mutate: setHeader("provenance", {
      joint_policy_converged: false,
      policy_fingerprint: "",
    }),
    name: "an empty policy fingerprint, which upstream's exporter refuses",
  },
  {
    mutate: setRecordAt(PLAY_IDENTITY, {
      n: 8.5,
      reported_marginal_se: 0.125,
    }),
    name: "a simulation count that is not a whole number",
  },
  {
    mutate: setHeader("provenance", {
      joint_policy_converged: "false",
      policy_fingerprint: "fingerprint",
    }),
    name: "a convergence flag that is not a boolean",
  },
  {
    mutate: setHeader("policy_uncertainty", 0.01),
    name: "a measured policy uncertainty where the contract publishes none",
  },
  {
    mutate: (document) => {
      Reflect.deleteProperty(document, "policy_uncertainty");
    },
    name: "no policy uncertainty field at all",
  },
];

const shippedPlayUncertainty = () =>
  parsedOrThrow(shippedSidecar, PLAY_UNCERTAINTY_CONTRACT);

describe("the play uncertainty contract", () => {
  it("reads the shipped sidecar through the app's own hand key", () => {
    const identity = playRecordIdentity({
      handKey: normalizePlayHandKey(parseHand(SHIPPED_HAND)),
      role: CribRole.Dealer,
    });
    const standardError = uncertaintyStandardError(
      shippedPlayUncertainty(),
      identity,
    );

    expect(identity).toBe(`${SHIPPED_HAND_KEY}/Dealer/delta`);
    expect(standardError).toBeGreaterThan(0);
  });

  it("reports an identity the shipped sidecar does not publish as absent", () => {
    expect(
      uncertaintyStandardError(
        shippedPlayUncertainty(),
        `${SHIPPED_HAND_KEY}/Dealer/nope`,
      ),
    ).toBeNull();
  });

  /*
   * The published sidecar covers every kept hand and role the app can ask
   * about, so the unavailable path is real code that no valid hand reaches.
   * Asserting it here is what makes that a measured claim rather than a
   * remembered one.
   */
  it("publishes a standard error for every kept hand in both roles", () => {
    const uncertainty = shippedPlayUncertainty();
    const missing = CANONICAL_PLAY_HAND_KEYS.flatMap((handKey) =>
      Object.values(CribRole).filter(
        (role) =>
          uncertaintyStandardError(uncertainty, `${handKey}/${role}/delta`) ===
          null,
      ),
    );

    expect(CANONICAL_PLAY_HAND_KEYS).toHaveLength(PUBLISHED_HAND_COUNT);
    expect(missing).toStrictEqual([]);
  });

  /*
   * The vendored means table holds the same 1,820 keys in a different order -
   * it begins 2_2_2_2 where rank order begins A_A_A_A - so a derivation taken
   * from the table would reject every published sidecar. Comparing them as
   * sorted sets is what ties this derivation to the table the app looks up
   * without importing the table's ordering.
   */
  it("derives the same hand keys the vendored play table holds", () => {
    expect([...CANONICAL_PLAY_HAND_KEYS].sort()).toStrictEqual(
      Object.keys(playTableData).sort(),
    );
  });

  /*
   * The two halves of play's policy qualification sit at different levels,
   * and the reader consumes neither, so nothing else in the build would
   * notice a document that moved one. Pinning the paths makes the claim in
   * playDeltaStandardError.ts and AGENTS.md falsifiable rather than
   * remembered - a reader reaching for provenance.policy_uncertainty gets
   * undefined and loses the qualification silently.
   */
  it("keeps the policy qualification at the levels the contract publishes", () => {
    const sidecar: object = shippedSidecar;
    const provenance = Reflect.get(sidecar, "provenance") as object;

    expect(Reflect.get(sidecar, "policy_uncertainty")).toBeNull();
    expect(Object.hasOwn(provenance, "policy_uncertainty")).toBe(false);
    expect(Reflect.get(provenance, "joint_policy_converged")).toBe(false);
    expect(Object.hasOwn(sidecar, "joint_policy_converged")).toBe(false);
  });

  /*
   * The flag's type is checked and its value deliberately is not. `false` is
   * what every document published so far carries, so a truthiness test would
   * reject exactly the sidecars this reader exists to read; `true` is what a
   * converged joint policy would publish inside version 1, an upstream
   * improvement rather than a malformation, and refusing it would deny every
   * pegging figure over a better simulation. The displayed copy makes no
   * convergence claim either way.
   */
  it.each([false, true])(
    "accepts a convergence flag of %p",
    (jointPolicyConverged) => {
      const parsed = parsedOrThrow(
        mutatedDocument(
          validPlayDocument,
          setHeader("provenance", {
            joint_policy_converged: jointPolicyConverged,
            policy_fingerprint: "fingerprint",
          }),
        ),
        PLAY_UNCERTAINTY_CONTRACT,
      );

      expect(uncertaintyStandardError(parsed, PLAY_IDENTITY)).toBeGreaterThan(
        0,
      );
    },
  );

  it.each(PLAY_REJECTIONS)("rejects $name", ({ mutate }) => {
    expect(
      parseUncertaintySidecar(
        mutatedDocument(validPlayDocument, mutate),
        PLAY_UNCERTAINTY_CONTRACT,
      ),
    ).toBeNull();
  });
});
