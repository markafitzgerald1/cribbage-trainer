/* jscpd:ignore-start */
import {
  CRIB_IDENTITY,
  type RejectionCase,
  mutatedDocument,
  parsedOrThrow,
  setHeader,
  setRecordAt,
  validCribDocument,
} from "./uncertaintySidecar.test.common";
import {
  CRIB_UNCERTAINTY_CONTRACT,
  cribRecordIdentity,
} from "./cribUncertainty";
import { describe, expect, it } from "@jest/globals";
import {
  parseUncertaintySidecar,
  uncertaintyStandardError,
} from "./uncertaintySidecar";
import { CribRole } from "./expectedCribPoints";
import shippedSidecar from "./expectedCribPointsUncertainty.json";
/* jscpd:ignore-end */

const SHIPPED_IDENTITY = cribRecordIdentity({
  discardKey: "A_A_Unsuited",
  role: CribRole.Dealer,
  slot: "total",
  starterRank: "A",
});
const SHIPPED_STANDARD_ERROR = 0.0236;

/*
 * What version 1 pins for crib alone. Everything the two sidecars share is
 * asserted against both contracts in uncertaintySidecar.test.ts.
 */
const CRIB_REJECTIONS: readonly RejectionCase[] = [
  { mutate: setHeader("ranks", []), name: "an empty starter rank list" },
  {
    mutate: setHeader("ranks", ["A", "2", "3"]),
    name: "a starter rank list the contract does not pin",
  },
  {
    mutate: setHeader("slots", [
      "total",
      "matching_discard_suit",
      "non_matching_discard_suit",
      "matching_rank_1_suit",
      "made_up_slot",
    ]),
    name: "a slot list ending in one the contract does not list",
  },
  {
    mutate: setRecordAt(CRIB_IDENTITY, { n: 8, reported_marginal_se: 0.1 }),
    name: "a missing squared weight",
  },
  {
    mutate: setRecordAt(CRIB_IDENTITY, {
      n: 2,
      reported_marginal_se: 0.1,
      sum_w2: 4,
    }),
    name: "a weighted-variance denominator that is not positive",
  },
];

describe("the crib uncertainty contract", () => {
  it("reads the shipped sidecar", () => {
    const parsed = parsedOrThrow(shippedSidecar, CRIB_UNCERTAINTY_CONTRACT);

    expect(uncertaintyStandardError(parsed, SHIPPED_IDENTITY)).toBeCloseTo(
      SHIPPED_STANDARD_ERROR,
      4,
    );
  });

  it("reports an identity the shipped sidecar does not publish as absent", () => {
    const parsed = parsedOrThrow(shippedSidecar, CRIB_UNCERTAINTY_CONTRACT);

    expect(
      uncertaintyStandardError(parsed, "A_A_Unsuited/Dealer/A/nope"),
    ).toBeNull();
  });

  it.each(CRIB_REJECTIONS)("rejects $name", ({ mutate }) => {
    expect(
      parseUncertaintySidecar(
        mutatedDocument(validCribDocument, mutate),
        CRIB_UNCERTAINTY_CONTRACT,
      ),
    ).toBeNull();
  });
});
