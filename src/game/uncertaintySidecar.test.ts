/* jscpd:ignore-start */
import {
  CANONICAL_ROLES,
  type UncertaintyContract,
  parseUncertaintySidecar,
  uncertaintyStandardError,
} from "./uncertaintySidecar";
import {
  CRIB_IDENTITY,
  FIXTURE_STANDARD_ERROR,
  PLAY_IDENTITY,
  type RejectionCase,
  type SidecarDocument,
  groupsOf,
  mapList,
  mutatedDocument,
  parsedOrThrow,
  renameRecordAt,
  setHeader,
  setRecordAt,
  setTotalsField,
  validCribDocument,
  validPlayDocument,
} from "./uncertaintySidecar.test.common";
import { describe, expect, it } from "@jest/globals";
import { CRIB_UNCERTAINTY_CONTRACT } from "./cribUncertainty";
import { CribRole } from "./expectedCribPoints";
import { PLAY_UNCERTAINTY_CONTRACT } from "./playUncertainty";
/* jscpd:ignore-end */

interface TableCase {
  readonly contract: UncertaintyContract;
  readonly identity: string;
  readonly name: string;
  readonly validDocument: () => SidecarDocument;
}

/*
 * One schema describes both published sidecars, so every rejection that is
 * not about a table's own vocabulary is asserted against both rather than
 * written out twice. What each table pins for itself - crib's starter ranks
 * and weighted-variance denominator, play's empty rank list - is asserted in
 * that table's own spec, alongside reading its real shipped document.
 */
const TABLES: readonly TableCase[] = [
  {
    contract: CRIB_UNCERTAINTY_CONTRACT,
    identity: CRIB_IDENTITY,
    name: "crib",
    validDocument: validCribDocument,
  },
  {
    contract: PLAY_UNCERTAINTY_CONTRACT,
    identity: PLAY_IDENTITY,
    name: "play",
    validDocument: validPlayDocument,
  },
];

/*
 * The published list is a literal in the reader, so an app-side reorder can no
 * longer change it. What is worth asserting instead is that the app's own
 * seats still match what the sidecars are keyed by: if `CribRole` ever gains,
 * loses or renames a seat, every lookup would miss and this says so directly
 * rather than leaving the figures to vanish.
 */
const PUBLISHED_ROLES = ["Dealer", "Pone"];

const HEADER_REJECTIONS: readonly RejectionCase[] = [
  {
    mutate: setHeader("schema", "expected-points-uncertainty.v2"),
    name: "an unsupported schema",
  },
  { mutate: setHeader("table", "elsewhere"), name: "another table" },
  {
    mutate: setHeader("statistic", "calibrated_se"),
    name: "another statistic",
  },
  {
    mutate: setHeader("n_semantics", "made_up_semantics"),
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
  { mutate: setHeader("keys", []), name: "an empty key list" },
  { mutate: setHeader("roles", []), name: "an empty role list" },
  { mutate: setHeader("slots", []), name: "an empty slot list" },
  { mutate: setHeader("roles", [1, 2]), name: "a role list of non-strings" },
  { mutate: setHeader("roles", "Dealer"), name: "a role list that is no list" },
  {
    mutate: mapList("keys", (keys) => [...keys, keys.at(0)]),
    name: "more keys than the contract has",
  },
  {
    mutate: mapList("keys", (keys) => ["not a key", ...keys.slice(1)]),
    name: "a key the contract does not list",
  },
  {
    mutate: mapList("keys", (keys) => [
      keys.at(1),
      keys.at(0),
      ...keys.slice(2),
    ]),
    name: "the keys in another order",
  },
  { mutate: setHeader("roles", ["Dealer", "Banker"]), name: "an unknown role" },
  {
    mutate: mapList("slots", (slots) => ["made_up_slot", ...slots.slice(1)]),
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

const recordRejections = (identity: string): readonly RejectionCase[] => [
  {
    mutate: setRecordAt(identity, 0.1),
    name: "a record that is not an object",
  },
  {
    mutate: setRecordAt(identity, { reported_marginal_se: 0.1, sum_w2: 4 }),
    name: "a missing weight",
  },
  {
    mutate: setRecordAt(identity, { n: 8, sum_w2: 4 }),
    name: "a missing standard error",
  },
  {
    mutate: setRecordAt(identity, {
      n: 8,
      reported_marginal_se: -0.1,
      sum_w2: 4,
    }),
    name: "a negative standard error",
  },
  {
    mutate: setRecordAt(identity, {
      n: 1,
      reported_marginal_se: 0.1,
      sum_w2: 0.5,
    }),
    name: "fewer observations than the exporter would keep",
  },
  {
    mutate: renameRecordAt(identity, `${identity}/extra`),
    name: "an identity with a part too many",
  },
  {
    mutate: renameRecordAt(identity, identity.replace(/\/[^/]+$/u, "")),
    name: "an identity with a part too few",
  },
  {
    mutate: renameRecordAt(identity, identity.replace("Dealer", "Banker")),
    name: "a role the header does not declare",
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

describe("the vocabulary version 1 pins for both tables", () => {
  it("lists the published roles in the published order", () => {
    expect(CANONICAL_ROLES).toStrictEqual(PUBLISHED_ROLES);
  });

  it("keys the sidecars by the app's own seats", () => {
    expect(Object.values(CribRole)).toStrictEqual([...CANONICAL_ROLES]);
  });
});

describe.each(TABLES)(
  "parseUncertaintySidecar for the $name sidecar",
  ({ contract, identity, validDocument }) => {
    const mutated = (mutate: RejectionCase["mutate"]): unknown =>
      mutatedDocument(validDocument, mutate);

    it.each([null, 7, "sidecar", []])("rejects %p", (value) => {
      expect(parseUncertaintySidecar(value, contract)).toBeNull();
    });

    it.each([...HEADER_REJECTIONS, ...recordRejections(identity)])(
      "rejects $name",
      ({ mutate }) => {
        expect(parseUncertaintySidecar(mutated(mutate), contract)).toBeNull();
      },
    );

    it("reads the standard error a valid document publishes", () => {
      const parsed = parsedOrThrow(validDocument(), contract);

      expect(uncertaintyStandardError(parsed, identity)).toBe(
        FIXTURE_STANDARD_ERROR,
      );
    });

    it("keeps a measured standard error of zero", () => {
      const parsed = parsedOrThrow(
        mutated(
          setRecordAt(identity, { n: 8, reported_marginal_se: 0, sum_w2: 4 }),
        ),
        contract,
      );

      expect(uncertaintyStandardError(parsed, identity)).toBe(0);
    });

    it("ignores unknown header fields, record fields and record groups", () => {
      const parsed = parsedOrThrow(
        mutated((document) => {
          setHeader("future_header_field", "ignored")(document);
          Reflect.set(groupsOf(document), "categories", {
            record_count: 1,
            records: { "not/an/identity": { reported_marginal_se: 9 } },
          });
          setRecordAt(identity, {
            future_record_field: "ignored",
            n: 8,
            reported_marginal_se: FIXTURE_STANDARD_ERROR,
            sum_w2: 4,
          })(document);
        }),
        contract,
      );

      expect(uncertaintyStandardError(parsed, identity)).toBe(
        FIXTURE_STANDARD_ERROR,
      );
    });
  },
);
