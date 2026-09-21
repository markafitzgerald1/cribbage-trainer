import {
  type CribUncertainty,
  cribRecordIdentity,
  parseCribUncertainty,
} from "./cribUncertainty";

/*
 * The smallest document the reader accepts, shared so the reader's own specs
 * and the loader's do not each spell one out - jscpd counts the second copy.
 */
export const VALID_IDENTITY = cribRecordIdentity({
  discardKey: "A_2_Suited",
  role: "Dealer",
  slot: "total",
  starterRank: "K",
});

export const validDocument = () => ({
  keys: ["A_2_Suited"],
  n_semantics: "sum_weights",
  qualifications: { crib: "crib text", play: "play text", scope: "scope text" },
  ranks: ["K"],
  record_groups: {
    totals: {
      record_count: 1,
      records: {
        [VALID_IDENTITY]: {
          n: 8,
          reported_marginal_se: 0.125,
          sum_w2: 4,
        },
      },
    },
  },
  roles: ["Dealer"],
  schema: "expected-points-uncertainty.v1",
  slots: ["total"],
  statistic: "reported_marginal_se",
  table: "crib",
});

/*
 * Parsing outside the test body, so a null check for a document the caller
 * expects to be valid is not a conditional inside a test.
 */
export const parsedOrThrow = (value: unknown): CribUncertainty => {
  const parsed = parseCribUncertainty(value);
  if (parsed === null) {
    throw new Error("Expected the document to parse");
  }
  return parsed;
};
