import {
  CRIB_UNCERTAINTY_CONTRACT,
  cribRecordIdentity,
} from "./cribUncertainty";
import {
  PLAY_UNCERTAINTY_CONTRACT,
  playRecordIdentity,
} from "./playUncertainty";
import {
  type Uncertainty,
  type UncertaintyContract,
  parseUncertaintySidecar,
} from "./uncertaintySidecar";
import { CribRole } from "./expectedCribPoints";
import { type UncertaintySource } from "./uncertaintyLoader";

export type SidecarDocument = Record<string, unknown>;

export type Mutation = (document: SidecarDocument) => void;

export interface RejectionCase {
  readonly mutate: Mutation;
  readonly name: string;
}

export const FIXTURE_STANDARD_ERROR = 0.125;

/*
 * Obviously synthetic, so nobody reads it as the digest of anything. The
 * reader checks each digest field's shape rather than hashing against it - a
 * browser is handed a parsed document, not the published bytes it was named
 * for.
 */
const FAKE_DIGEST = "0".repeat(64);

export const CRIB_IDENTITY = cribRecordIdentity({
  discardKey: "A_2_Suited",
  role: CribRole.Dealer,
  slot: "total",
  starterRank: "K",
});

export const PLAY_IDENTITY = playRecordIdentity({
  handKey: "A_2_3_4",
  role: CribRole.Dealer,
});

/*
 * The smallest document the reader accepts for a given table, built from that
 * table's own contract so one fixture serves both sidecars - jscpd counts a
 * second hand-written copy, and the two differ only in what the contract
 * already names. What keeps this from merely agreeing with a wrong contract
 * is that each table's spec also parses its real shipped sidecar.
 */
const validDocumentFor = (
  contract: UncertaintyContract,
  identity: string,
  weights: Readonly<Record<string, number>>,
): SidecarDocument => ({
  keys: [...contract.vocabulary.keys],
  means_sha256: FAKE_DIGEST,
  n_semantics: contract.nSemantics,
  provenance: { generation_method: "artifact_pipeline.generate_table.v3" },
  qualifications: { crib: "crib text", play: "play text", scope: "scope text" },
  ranks: [...contract.vocabulary.ranks],
  record_groups: {
    totals: {
      record_count: 1,
      records: {
        [identity]: {
          ...weights,
          reported_marginal_se: FIXTURE_STANDARD_ERROR,
        },
      },
    },
  },
  roles: [...contract.vocabulary.roles],
  schema: "expected-points-uncertainty.v1",
  slots: [...contract.vocabulary.slots],
  source_full_sha256: FAKE_DIGEST,
  statistic: "reported_marginal_se",
  table: contract.table,
});

export const validCribDocument = (): SidecarDocument =>
  validDocumentFor(CRIB_UNCERTAINTY_CONTRACT, CRIB_IDENTITY, {
    n: 8,
    sum_w2: 4,
  });

export const validPlayDocument = (): SidecarDocument =>
  validDocumentFor(PLAY_UNCERTAINTY_CONTRACT, PLAY_IDENTITY, { n: 8 });

export const mutatedDocument = (
  validDocument: () => SidecarDocument,
  mutate: Mutation,
): unknown => {
  const document = validDocument();
  mutate(document);
  return document;
};

export const groupsOf = (document: SidecarDocument): object =>
  Reflect.get(document, "record_groups") as object;

export const totalsOf = (document: SidecarDocument): SidecarDocument =>
  Reflect.get(groupsOf(document), "totals") as SidecarDocument;

const recordsOf = (document: SidecarDocument): object =>
  Reflect.get(totalsOf(document), "records") as object;

export const setHeader = (field: string, value: unknown): Mutation =>
  function setHeaderField(document) {
    Reflect.set(document, field, value);
  };

export const setTotalsField = (field: string, value: unknown): Mutation =>
  function setTotalsProperty(document) {
    Reflect.set(totalsOf(document), field, value);
  };

export const setRecordAt = (identity: string, value: unknown): Mutation =>
  function setRecordValue(document) {
    Reflect.set(recordsOf(document), identity, value);
  };

export const renameRecordAt = (from: string, to: string): Mutation =>
  function renameRecordIdentity(document) {
    const records = recordsOf(document);

    Reflect.set(records, to, Reflect.get(records, from));
    Reflect.deleteProperty(records, from);
  };

/*
 * Rewrites one declared vocabulary list in place. Taking the transform rather
 * than the finished list keeps each malformation a single expression, which
 * is what stops three of them reading as one duplicated block.
 */
export const mapList = (
  field: string,
  transform: (values: readonly string[]) => readonly unknown[],
): Mutation =>
  function mapVocabularyList(document) {
    Reflect.set(
      document,
      field,
      transform(Reflect.get(document, field) as readonly string[]),
    );
  };

/*
 * Parsing outside the test body, so a null check for a document the caller
 * expects to be valid is not a conditional inside a test.
 */
export const parsedOrThrow = (
  value: unknown,
  contract: UncertaintyContract,
): Uncertainty => {
  const parsed = parseUncertaintySidecar(value, contract);
  if (parsed === null) {
    throw new Error("Expected the document to parse");
  }
  return parsed;
};

/*
 * A source that has nothing yet and resolves the given value, which is what a
 * shipped one looks like on a first mount. Callers hold one instance: the
 * source is an effect dependency, so a fresh object per render would restart
 * the load every render.
 */
export const deferredUncertainty = (
  value: Uncertainty | null,
): UncertaintySource => ({
  getUncertaintySync: () => null,
  loadUncertainty: () => Promise.resolve(value),
});

export const rejectingUncertainty = (): UncertaintySource => ({
  getUncertaintySync: () => null,
  loadUncertainty: () => Promise.reject(new Error("offline")),
});

export interface TrackedUncertaintySource {
  readonly loadCount: () => number;
  readonly settled: () => Promise<void>;
  readonly source: UncertaintySource;
}

// After every queued promise callback, so a state update the load provoked has been applied rather than merely scheduled.
const nextTimerTick = (): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, 0);
  });

/*
 * Resolved on a timer rather than immediately, because an immediate stub is
 * the least realistic model of the thing being stubbed: these sidecars are
 * 0.3 MB and 1.2 MB chunks fetched over a network. A same-tick stub settles
 * inside whatever `await` a spec already had, which quietly makes a later
 * absence assertion look load-bearing when it is only winning a race that
 * production would lose.
 */

/*
 * An unavailable source whose loads a caller can wait out. A negative
 * assertion made while the deferred load is still in flight is satisfied by
 * the race rather than by the code under test - a build that rendered the
 * figure only once the promise settled would pass it - so any spec asserting
 * that no figure is on screen has to settle this first. The two outcomes take
 * different paths through the hook, so both are offered rather than only the
 * resolved one.
 */
export const trackedUnavailableUncertainty = (
  outcome: "reject" | "resolve",
): TrackedUncertaintySource => {
  const loads: Promise<unknown>[] = [];
  const source: UncertaintySource = {
    getUncertaintySync: () => null,
    loadUncertainty: () => {
      const load = nextTimerTick().then(() => {
        if (outcome === "reject") {
          throw new Error("offline");
        }
        return null;
      });

      loads.push(load.catch(() => null));
      return load;
    },
  };

  return {
    loadCount: () => loads.length,
    settled: async () => {
      await Promise.all(loads);
      await nextTimerTick();
    },
    source,
  };
};

// Every bucket reports the same standard error, so a correct bound returns it unchanged.
export const uniformUncertainty = (standardError: number): Uncertainty => ({
  totals: { get: () => standardError },
});
