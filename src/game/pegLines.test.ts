import { describe, expect, it } from "@jest/globals";
import { CANONICAL_PLAY_HAND_KEYS } from "./playUncertainty";
import { expectedPlayPointsTable } from "../analysis/analysis.test.common";
import { parsePegLines } from "./pegLines";
import shippedLines from "./expectedPlayPointsLines.json";

interface LinesDocument {
  columns: unknown;
  entries: [unknown[][], unknown[][]][];
  keys: unknown[];
  means_sha256: unknown;
  precision: unknown;
  provenance: Record<string, unknown>;
  qualifications: Record<string, unknown>;
  ranks: unknown;
  roles: unknown;
  schema: unknown;
}

type Edit = (document: LinesDocument) => void;
type RejectionCase = readonly [name: string, edit: Edit];

const FIRST_HAND = 0;
const SECOND_HAND = 1;
const PONE = 0;
const DEALER = 1;
const LEAD = 0;
const COUNT = 1;
const MEAN = 2;
const STANDARD_ERROR = 3;
const RESPONSE = 4;
const RESPONSE_COUNT = 5;
const SHIPPED_HAND_COUNT = 1820;
const UNSAFE_COUNT = Number.MAX_SAFE_INTEGER + 1;

/*
 * Three kept hands: two with rows (a thin Pone cell, a measured zero, and
 * hands whose ranks bound the legal leads and replies) and one whose role
 * arrays are empty, which the contract calls unavailable.
 */
const validDocument = (): LinesDocument => ({
  columns: [
    ["lead", "n", "mu", "se"],
    ["lead", "n", "mu", "se", "response", "response_n"],
  ],
  entries: [
    [
      [
        [0, 3, 2.0, 2.3],
        [1, 1, null, null],
        [2, 1, null, null],
      ],
      [
        [8, 3, -1.333, 3.5, 0, 2],
        [9, 2, 0.0, 0.0, 2, 1],
      ],
    ],
    [[[4, 5, 1.5, 0.1]], [[12, 2, 0.25, 0.5, 10, 2]]],
    [[], []],
  ],
  keys: ["A_2_3_4", "5_5_5_J", "K_K_K_K"],
  means_sha256: "a".repeat(64),
  precision: { mu_decimals: 3, se_significant_figures: 2 },
  provenance: {
    generation_method: "artifact_pipeline.generate_play_table.v3",
    joint_policy_converged: false,
    policy_fingerprint: "fingerprint",
    seed: 42,
  },
  qualifications: {
    missing: "Absent means unavailable.",
    policy: "Observed frozen policy behavior.",
    statistics: "Conditional on opening lead.",
  },
  ranks: "A23456789TJQK",
  roles: ["Pone", "Dealer"],
  schema: "expected-play-lines.v1",
});

const mutated = (edit: Edit): unknown => {
  const built = validDocument();
  edit(built);
  return built;
};

const rowAt = (document: LinesDocument, role: number, row: number): unknown[] =>
  document.entries.at(FIRST_HAND)?.at(role)?.at(row) ?? [];

const assign =
  (
    locate: (document: LinesDocument) => object,
    key: number | string,
  ): ((value: unknown) => Edit) =>
  (value) =>
  (document) => {
    Reflect.set(locate(document), key, value);
  };

const setTop = (field: string) => assign((document) => document, field);

const setNested = (group: "provenance" | "qualifications", field: string) =>
  assign((document) => document[group], field);

const setCell = (role: number, row: number, column: number) =>
  assign((document) => rowAt(document, role, row), column);

const setKeyAt = (index: number) => assign((document) => document.keys, index);

const setEntryAt = (index: number) =>
  assign((document) => document.entries, index);

const keepHands =
  (count: number): Edit =>
  (document) => {
    document.keys.splice(count);
    document.entries.splice(count);
  };

const describeValue = (value: unknown): string =>
  `${typeof value} ${JSON.stringify(value)}`;

const caseTable = (
  label: string,
  values: readonly unknown[],
  edit: (value: unknown) => Edit,
): RejectionCase[] =>
  values.map((value) => [`${label} of ${describeValue(value)}`, edit(value)]);

const SWAPPED_STATISTICS = ["lead", "n", "se", "mu"];
const RENAMED_REPLY = ["lead", "n", "mu", "se", "response", "count"];
const OTHER_PRECISION = { mu_decimals: 2, se_significant_figures: 2 };
const EXTRA_PRECISION = {
  extra: 1,
  mu_decimals: 3,
  se_significant_figures: 2,
};

const HEADER_REJECTIONS: RejectionCase[] = [
  ...caseTable("schema", ["expected-play-lines.v2", null], setTop("schema")),
  ...caseTable(
    "means digest",
    ["no", null, "A".repeat(64), ["a".repeat(64)], 7],
    setTop("means_sha256"),
  ),
  ...caseTable("ranks", ["A23456789TJQ", null], setTop("ranks")),
  ...caseTable(
    "roles",
    [["Dealer", "Pone"], ["Pone"], "PoneDealer"],
    setTop("roles"),
  ),
  ...caseTable(
    "columns",
    [
      null,
      [["lead", "n", "mu", "se"]],
      [SWAPPED_STATISTICS, ["lead"]],
      [["lead", "n", "mu", "se"], RENAMED_REPLY],
    ],
    setTop("columns"),
  ),
  ...caseTable(
    "precision",
    [null, OTHER_PRECISION, EXTRA_PRECISION, { mu_decimals: 3 }],
    setTop("precision"),
  ),
];

const METADATA_REJECTIONS: RejectionCase[] = [
  ...caseTable("provenance", [null, "frozen"], setTop("provenance")),
  ...caseTable("qualifications", [null, "quote me"], setTop("qualifications")),
  ...caseTable(
    "seed",
    [true, 4.5, "42", null],
    setNested("provenance", "seed"),
  ),
  ...caseTable(
    "convergence flag",
    ["false", null, 0],
    setNested("provenance", "joint_policy_converged"),
  ),
  ...caseTable(
    "policy fingerprint",
    ["", null, 7],
    setNested("provenance", "policy_fingerprint"),
  ),
  ...caseTable(
    "generation method",
    ["", null],
    setNested("provenance", "generation_method"),
  ),
  ...["policy", "statistics", "missing"].flatMap((key) =>
    caseTable(
      `${key} qualification`,
      ["", "   ", null, 7],
      setNested("qualifications", key),
    ),
  ),
];

const KEY_REJECTIONS: RejectionCase[] = [
  ...caseTable("keys", [null, "A_2_3_4"], setTop("keys")),
  ...caseTable("entries", [null, {}], setTop("entries")),
  ...caseTable(
    "first key",
    [7, "2_A_3_4", "A_2_3", "A_2_3_4_5", "A_2_3_Z"],
    setKeyAt(FIRST_HAND),
  ),
  ...caseTable("second key", ["A_2_3_4"], setKeyAt(SECOND_HAND)),
  ...caseTable(
    "first entry",
    [null, [[], [], []], [null, []], [[], null]],
    setEntryAt(FIRST_HAND),
  ),
  [
    "a key list shorter than the entries",
    (document) => {
      document.keys.pop();
    },
  ],
  [
    "keys out of canonical order with their rows still matching",
    (document) => {
      document.keys.reverse();
      document.entries.reverse();
    },
  ],
];

const CELL_REJECTIONS: RejectionCase[] = [
  ...caseTable("Pone lead", [13, -1, 0.5, "A", 3], setCell(PONE, 0, LEAD)),
  ...caseTable("repeated lead", [0], setCell(PONE, 1, LEAD)),
  ...caseTable("Pone lead outside the hand", [5], setCell(PONE, 2, LEAD)),
  ...caseTable(
    "count",
    [0, 2.5, UNSAFE_COUNT, "3", null],
    setCell(PONE, 0, COUNT),
  ),
  ...caseTable(
    "mean at n of three",
    [null, "2", Infinity],
    setCell(PONE, 0, MEAN),
  ),
  ...caseTable(
    "error at n of three",
    [null, NaN, -0.1],
    setCell(PONE, 0, STANDARD_ERROR),
  ),
  ...caseTable("mean at n of one", [1.0], setCell(PONE, 1, MEAN)),
  ...caseTable("error at n of one", [0.5], setCell(PONE, 1, STANDARD_ERROR)),
  ...caseTable("reply", [5, 13, 0.5, "A"], setCell(DEALER, 0, RESPONSE)),
  ...caseTable("reply count", [0, 4, 1.5], setCell(DEALER, 0, RESPONSE_COUNT)),
  [
    "a Pone row that is not a list",
    (document) => {
      document.entries
        .at(FIRST_HAND)
        ?.at(PONE)
        ?.splice(0, 1, null as never);
    },
  ],
  [
    "a short Pone row",
    (document) => {
      rowAt(document, PONE, 0).pop();
    },
  ],
  [
    "a long Pone row",
    (document) => {
      rowAt(document, PONE, 0).push(0);
    },
  ],
  [
    "a short Dealer row",
    (document) => {
      rowAt(document, DEALER, 0).pop();
    },
  ],
];

describe("parsePegLines", () => {
  it.each([
    ...HEADER_REJECTIONS,
    ...METADATA_REJECTIONS,
    ...KEY_REJECTIONS,
    ...CELL_REJECTIONS,
  ])("treats a document with %s as unavailable", (_name, edit) => {
    expect(parsePegLines(mutated(edit))).toBeNull();
  });

  it.each([null, "lines", 7])(
    "treats %p as unavailable rather than throwing",
    (document) => {
      expect(parsePegLines(document)).toBeNull();
    },
  );

  it("reads Pone's leads with thin cells as null and measured zeros as zero", () => {
    const lines = parsePegLines(validDocument());

    expect(lines?.poneRows("A_2_3_4")).toStrictEqual([
      { count: 3, lead: 0, mean: 2, standardError: 2.3 },
      { count: 1, lead: 1, mean: null, standardError: null },
      { count: 1, lead: 2, mean: null, standardError: null },
    ]);
  });

  it("reads Dealer's measured zero as zero and keeps a reply seen once", () => {
    const lines = parsePegLines(validDocument());

    expect(lines?.dealerRows("A_2_3_4")).toStrictEqual([
      {
        count: 3,
        lead: 8,
        mean: -1.333,
        response: 0,
        responseCount: 2,
        standardError: 3.5,
      },
      {
        count: 2,
        lead: 9,
        mean: 0,
        response: 2,
        responseCount: 1,
        standardError: 0,
      },
    ]);
  });

  it.each([
    ["a hand the document omits", "A_A_A_A"],
    ["a hand whose roles are empty", "K_K_K_K"],
    ["a key that names no hand", "nonsense"],
  ])("answers %s as unavailable for both roles", (_name, handKey) => {
    const lines = parsePegLines(validDocument());

    expect([
      lines?.poneRows(handKey),
      lines?.dealerRows(handKey),
    ]).toStrictEqual([null, null]);
  });

  it("accepts a converged policy, which is an improvement and not a malformation", () => {
    const lines = parsePegLines(
      mutated(setNested("provenance", "joint_policy_converged")(true)),
    );

    expect(lines?.policyConverged).toBe(true);
  });

  it("reports a policy that has not converged as false, not unavailable", () => {
    expect(parsePegLines(validDocument())?.policyConverged).toBe(false);
  });

  it("hands back the qualifications for quotation", () => {
    expect(parsePegLines(validDocument())?.qualifications).toStrictEqual({
      missing: "Absent means unavailable.",
      policy: "Observed frozen policy behavior.",
      statistics: "Conditional on opening lead.",
    });
  });

  it("accepts a bounded run that covers only some hands", () => {
    const lines = parsePegLines(mutated(keepHands(SECOND_HAND)));

    expect(lines?.poneRows("A_2_3_4")).not.toBeNull();
  });

  it("accepts no hands at all, with every lookup unavailable", () => {
    const lines = parsePegLines(mutated(keepHands(0)));

    expect(lines?.poneRows("A_2_3_4")).toBeNull();
  });
});

describe("the shipped pegging lines", () => {
  it("are readable, in the contract's canonical key order", () => {
    expect(shippedLines.keys).toStrictEqual([...CANONICAL_PLAY_HAND_KEYS]);
    expect(parsePegLines(shippedLines)).not.toBeNull();
  });

  it("cover exactly the hands the play means table does, in a different order", () => {
    expect([...shippedLines.keys].sort()).toStrictEqual(
      Object.keys(expectedPlayPointsTable).sort(),
    );
    expect(shippedLines.keys).toHaveLength(SHIPPED_HAND_COUNT);
    expect(shippedLines.keys).not.toStrictEqual(
      Object.keys(expectedPlayPointsTable),
    );
  });

  it("answer a hand's leads for both roles", () => {
    const lines = parsePegLines(shippedLines);

    expect([
      lines?.poneRows("A_A_A_A")?.at(0)?.lead,
      lines?.dealerRows("A_A_A_A")?.at(0)?.lead,
    ]).toStrictEqual([0, 1]);
  });

  it("declare the policy not converged, which the reader accepts either way", () => {
    expect(parsePegLines(shippedLines)?.policyConverged).toBe(false);
  });

  it("are rejected once the keys follow the means table's order", () => {
    const reordered = {
      ...shippedLines,
      keys: Object.keys(expectedPlayPointsTable),
    };

    expect(parsePegLines(reordered)).toBeNull();
  });
});
