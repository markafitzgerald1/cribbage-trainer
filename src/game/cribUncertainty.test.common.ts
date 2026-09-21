import {
  type CribUncertainty,
  cribRecordIdentity,
  parseCribUncertainty,
} from "./cribUncertainty";
import { type CribUncertaintySource } from "./cribUncertaintyLoader";

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

/*
 * Obviously synthetic, so nobody reads it as the digest of anything. The
 * reader checks the field's shape rather than hashing against it - a browser
 * is handed a parsed table, not the published bytes it was named for.
 */
const FAKE_MEANS_DIGEST = "0".repeat(64);

export const validDocument = () => ({
  keys: ["A_2_Suited"],
  means_sha256: FAKE_MEANS_DIGEST,
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

/*
 * A source that has nothing yet and resolves the given value, which is what
 * the shipped one looks like on a first mount. Callers hold one instance: the
 * source is an effect dependency, so a fresh object per render would restart
 * the load every render.
 */
export const deferredUncertainty = (
  value: CribUncertainty | null,
): CribUncertaintySource => ({
  getCribUncertaintySync: () => null,
  loadCribUncertainty: () => Promise.resolve(value),
});

export const rejectingUncertainty = (): CribUncertaintySource => ({
  getCribUncertaintySync: () => null,
  loadCribUncertainty: () => Promise.reject(new Error("offline")),
});

// Every bucket reports the same standard error, so a correct bound returns it unchanged.
export const uniformUncertainty = (standardError: number): CribUncertainty => ({
  totals: { get: () => standardError },
});
