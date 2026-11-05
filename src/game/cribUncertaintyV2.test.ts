import {
  V2_IDENTITIES,
  V2_REJECTIONS,
  V2_RELATION,
  V2_ROOT,
  rejectedV2Document,
  v2Diagnostics,
  v2Document,
} from "./cribUncertaintyV2.test.common";
import { describe, expect, it } from "@jest/globals";
import {
  validCribV2Header,
  validCribV2Identity,
} from "./cribUncertaintyV2.mjs";
import { CRIB_UNCERTAINTY_CONTRACT } from "./cribUncertainty";
import { PLAY_UNCERTAINTY_CONTRACT } from "./playUncertainty";
import { parseUncertaintySidecar } from "./uncertaintySidecar";
import { validCribDocument } from "./uncertaintySidecar.test.common";

const fixture = () => v2Document(CRIB_UNCERTAINTY_CONTRACT.vocabulary);
const parse = (value: unknown) =>
  parseUncertaintySidecar(value, CRIB_UNCERTAINTY_CONTRACT);

describe("crib v2 semantics", () => {
  it("reads root zero and relation SE without inventing a missing relation", () => {
    const parsed = parse(fixture());

    expect(parsed?.totals.get(V2_ROOT)).toBe(0);
    expect(parsed?.totals.get(V2_RELATION)).toBe(0.125);
    expect(
      parsed?.totals.get("A_2_Suited/Dealer/Q/matching_discard_suit"),
    ).toBeUndefined();
  });

  it.each(V2_REJECTIONS)("rejects $name independently", ({ path, value }) => {
    expect(
      parse(
        rejectedV2Document(CRIB_UNCERTAINTY_CONTRACT.vocabulary, path, value),
      ),
    ).toBeNull();
  });

  it.each(V2_IDENTITIES)("checks relation identity %s", (identity, valid) => {
    expect(validCribV2Identity(identity)).toBe(valid);
  });

  it.each([null, 42])("rejects invalid v2 provenance %p", (provenance) => {
    expect(validCribV2Header({ ...fixture(), provenance })).toBe(false);
  });

  it.each([null, -42])(
    "accepts a matching seed %p and measured diagnostics",
    (seed) => {
      const doc = v2Diagnostics(CRIB_UNCERTAINTY_CONTRACT.vocabulary, seed);

      expect(parse(doc)).not.toBeNull();
    },
  );

  it("rejects v2 play and v1 crib with v4 provenance", () => {
    const doc = fixture();

    expect(parseUncertaintySidecar(doc, PLAY_UNCERTAINTY_CONTRACT)).toBeNull();
    expect(
      parse({ ...validCribDocument(), provenance: doc.provenance }),
    ).toBeNull();
  });
});
