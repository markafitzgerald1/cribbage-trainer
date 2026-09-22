import {
  VALID_IDENTITY,
  parsedOrThrow,
  validDocument,
} from "./cribUncertainty.test.common";
import {
  cribRecordIdentity,
  cribStandardError,
  parseCribUncertainty,
} from "./cribUncertainty";
import { describe, expect, it } from "@jest/globals";
import shippedSidecar from "./expectedCribPointsUncertainty.json";

type SidecarDocument = Record<string, unknown>;
type Mutation = (document: SidecarDocument) => void;

interface RejectionCase {
  readonly mutate: Mutation;
  readonly name: string;
}

const SHIPPED_IDENTITY = cribRecordIdentity({
  discardKey: "A_A_Unsuited",
  role: "Dealer",
  slot: "total",
  starterRank: "A",
});
const SHIPPED_STANDARD_ERROR = 0.0236;
const FIXTURE_STANDARD_ERROR = 0.125;

const mutated = (mutate: Mutation): unknown => {
  const document = validDocument() as unknown as SidecarDocument;
  mutate(document);
  return document;
};

const groupsOf = (document: SidecarDocument): object =>
  Reflect.get(document, "record_groups") as object;

const totalsOf = (document: SidecarDocument): SidecarDocument =>
  Reflect.get(groupsOf(document), "totals") as SidecarDocument;

const recordsOf = (document: SidecarDocument): object =>
  Reflect.get(totalsOf(document), "records") as object;

const setHeader = (field: string, value: unknown): Mutation =>
  function setHeaderField(document) {
    Reflect.set(document, field, value);
  };

const setTotalsField = (field: string, value: unknown): Mutation =>
  function setTotalsProperty(document) {
    Reflect.set(totalsOf(document), field, value);
  };

const setRecord = (value: unknown): Mutation =>
  function setRecordValue(document) {
    Reflect.set(recordsOf(document), VALID_IDENTITY, value);
  };

const renameRecord = (identity: string): Mutation =>
  function renameRecordIdentity(document) {
    const records = recordsOf(document);

    Reflect.set(records, identity, Reflect.get(records, VALID_IDENTITY));
    Reflect.deleteProperty(records, VALID_IDENTITY);
  };

const HEADER_REJECTIONS: readonly RejectionCase[] = [
  {
    mutate: setHeader("schema", "expected-points-uncertainty.v2"),
    name: "an unsupported schema",
  },
  { mutate: setHeader("table", "play"), name: "the play table" },
  {
    mutate: setHeader("statistic", "calibrated_se"),
    name: "another statistic",
  },
  {
    mutate: setHeader("n_semantics", "simulation_count"),
    name: "another weight semantics",
  },
  {
    mutate: setHeader("means_sha256", "not-a-digest"),
    name: "a means digest that is not one",
  },
  {
    mutate: (document) => {
      Reflect.deleteProperty(document, "means_sha256");
    },
    name: "no means digest at all",
  },
  {
    mutate: setHeader("source_full_sha256", "not-a-digest"),
    name: "a source digest that is not one",
  },
  {
    mutate: (document) => {
      Reflect.deleteProperty(document, "provenance");
    },
    name: "no provenance at all",
  },
  {
    mutate: setHeader("qualifications", { crib: "c", play: "p" }),
    name: "a missing qualification",
  },
  {
    mutate: setHeader("qualifications", { crib: "", play: "p", scope: "s" }),
    name: "an emptied qualification",
  },
  {
    mutate: setHeader("qualifications", "none"),
    name: "qualifications that are not an object",
  },
  { mutate: setHeader("keys", []), name: "an empty discard key list" },
  { mutate: setHeader("roles", []), name: "an empty role list" },
  { mutate: setHeader("ranks", []), name: "an empty starter rank list" },
  { mutate: setHeader("slots", []), name: "an empty slot list" },
  { mutate: setHeader("roles", [1]), name: "a role list of non-strings" },
  {
    mutate: (document) => {
      Reflect.set(document, "keys", [
        ...(Reflect.get(document, "keys") as string[]),
        "A_2_Suited",
      ]);
    },
    name: "more discard keys than the contract has",
  },
  {
    mutate: (document) => {
      Reflect.set(document, "keys", [
        "not a discard key",
        ...(Reflect.get(document, "keys") as string[]).slice(1),
      ]);
    },
    name: "a discard key the contract does not list",
  },
  {
    mutate: (document) => {
      const keys = [...(Reflect.get(document, "keys") as string[])];

      Reflect.set(document, "keys", [keys[1], keys[0], ...keys.slice(2)]);
    },
    name: "the discard keys in another order",
  },
  { mutate: setHeader("roles", ["Dealer", "Banker"]), name: "an unknown role" },
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
    name: "an unknown slot",
  },
  { mutate: setHeader("record_groups", "none"), name: "no record groups" },
  {
    mutate: setHeader("record_groups", { totals: 3 }),
    name: "a totals group that is not an object",
  },
  {
    mutate: setHeader("record_groups", { totals: { record_count: 0 } }),
    name: "a totals group with no records",
  },
];

const RECORD_REJECTIONS: readonly RejectionCase[] = [
  { mutate: setRecord(0.1), name: "a record that is not an object" },
  {
    mutate: setRecord({ reported_marginal_se: 0.1, sum_w2: 4 }),
    name: "a missing weight",
  },
  {
    mutate: setRecord({ n: 8, reported_marginal_se: 0.1 }),
    name: "a missing squared weight",
  },
  { mutate: setRecord({ n: 8, sum_w2: 4 }), name: "a missing standard error" },
  {
    mutate: setRecord({ n: 8, reported_marginal_se: -0.1, sum_w2: 4 }),
    name: "a negative standard error",
  },
  {
    mutate: setRecord({ n: 1, reported_marginal_se: 0.1, sum_w2: 1 }),
    name: "fewer observations than the exporter would keep",
  },
  {
    mutate: setRecord({ n: 2, reported_marginal_se: 0.1, sum_w2: 4 }),
    name: "a weighted-variance denominator that is not positive",
  },
  {
    mutate: renameRecord("A_2_Suited/Dealer/K"),
    name: "too few identity parts",
  },
  {
    mutate: renameRecord("A_2_Suited/Dealer/X/total"),
    name: "a rank the header does not declare",
  },
  {
    mutate: setTotalsField("record_count", 2),
    name: "a declared record count that disagrees with the records",
  },
  {
    mutate: (document) => {
      setTotalsField("record_count", 0)(document);
      setTotalsField("records", {})(document);
    },
    name: "an empty record set",
  },
];

describe("parseCribUncertainty", () => {
  it("reads the shipped sidecar", () => {
    const parsed = parsedOrThrow(shippedSidecar);

    expect(cribStandardError(parsed, SHIPPED_IDENTITY)).toBeCloseTo(
      SHIPPED_STANDARD_ERROR,
      4,
    );
  });

  it("reports an identity the shipped sidecar does not publish as absent", () => {
    const parsed = parsedOrThrow(shippedSidecar);

    expect(cribStandardError(parsed, "A_A_Unsuited/Dealer/A/nope")).toBeNull();
  });

  it.each([null, 7, "sidecar", []])("rejects %p", (value) => {
    expect(parseCribUncertainty(value)).toBeNull();
  });

  it.each([...HEADER_REJECTIONS, ...RECORD_REJECTIONS])(
    "rejects $name",
    ({ mutate }) => {
      expect(parseCribUncertainty(mutated(mutate))).toBeNull();
    },
  );

  it("keeps a measured standard error of zero", () => {
    const parsed = parsedOrThrow(
      mutated(setRecord({ n: 8, reported_marginal_se: 0, sum_w2: 4 })),
    );

    expect(cribStandardError(parsed, VALID_IDENTITY)).toBe(0);
  });

  it("ignores unknown header fields, record fields and record groups", () => {
    const parsed = parsedOrThrow(
      mutated((document) => {
        setHeader("future_header_field", "ignored")(document);
        Reflect.set(groupsOf(document), "categories", {
          record_count: 1,
          records: { "not/an/identity": { reported_marginal_se: 9 } },
        });
        setRecord({
          future_record_field: "ignored",
          n: 8,
          reported_marginal_se: FIXTURE_STANDARD_ERROR,
          sum_w2: 4,
        })(document);
      }),
    );

    expect(cribStandardError(parsed, VALID_IDENTITY)).toBe(
      FIXTURE_STANDARD_ERROR,
    );
  });
});
