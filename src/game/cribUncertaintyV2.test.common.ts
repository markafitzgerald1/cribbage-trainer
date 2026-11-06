export const V2_ROOT = "A_2_Suited/Dealer/K/total";
export const V2_RELATION = "A_2_Suited/Dealer/K/matching_discard_suit";

export const v2Document = (vocabulary: object) => ({
  ...vocabulary,
  calibrated_comparison_uncertainty: null,
  cross_bucket_covariance: null,
  means_sha256: "0".repeat(64),
  n_semantics: "independent-vector-rows-per-active-stream",
  policy_uncertainty: null,
  provenance: {
    bootstrap_sha256: null as string | null,
    estimator_contract: "shared-rank-relation-v1",
    generation: 1,
    generation_method: "artifact_pipeline.generate_table.v4",
    policy_sha256: "1".repeat(64),
    relation_centering_contract: "uniform-two-card-rank-completion-v1",
    rng_contract: "python-random-sample-v1",
    sample_unit: "independent-vector-rows-per-active-stream",
    seed: 42 as number | null,
    selector_contract: "legacy-suit-sensitive-first-max-v1",
  },
  qualifications: { crib: "Conditional sampling", scope: "Marginal only" },
  record_groups: {
    totals: {
      record_count: 2,
      records: {
        [V2_RELATION]: { mu: -0.09375, n: 4, reported_marginal_se: 0.125 },
        [V2_ROOT]: { mu: 0.03125, n: 4, reported_marginal_se: 0 },
      } as Record<
        string,
        { mu: number; n: number; reported_marginal_se: number }
      >,
    },
  },
  schema: "expected-points-uncertainty.v2",
  selection_adjustment: null,
  source_full_sha256: "2".repeat(64),
  statistic: "reported_marginal_se",
  table: "crib",
  uncertainty_scope: "fixed-policy-sampling",
});

export const setV2Path = (
  document: object,
  path: readonly string[],
  value: unknown,
): void => {
  const parent = path
    .slice(0, -1)
    .reduce<object>(
      (current, key) => Reflect.get(current, key) as object,
      document,
    );
  Reflect.set(parent, path.at(-1) as string, value);
};

interface Rejection {
  readonly name: string;
  readonly path: readonly string[];
  readonly value: unknown;
}

const provenanceCases = [
  ["seed", "42"],
  ["seed", Number.MAX_SAFE_INTEGER + 1],
  ["generation", -1],
  ["generation", 1.5],
  ["generation", Number.MAX_SAFE_INTEGER + 1],
  ["policy_sha256", "bad"],
  ["policy_sha256", 42],
  ["bootstrap_sha256", "bad"],
  ["bootstrap_sha256", 42],
  ["estimator_contract", "wrong"],
  ["generation_accumulators", null],
  ["extra", {}],
  ["convergence_shift", -1],
  ["convergence_shift", "0"],
  ["precut_unresolved", 0],
] as const;
const recordCases = [
  ["n", Number.MAX_SAFE_INTEGER + 1],
  ["n", 1],
  ["n", 2.5],
  ["mu", Infinity],
  ["reported_marginal_se", -1],
  ["reported_marginal_se", NaN],
  ["extra", 0],
] as const;

export const V2_REJECTIONS: readonly Rejection[] = [
  ...provenanceCases.map(([field, value]) => ({
    name: `invalid provenance ${field}: ${JSON.stringify(value)}`,
    path: ["provenance", field],
    value,
  })),
  ...recordCases.map(([field, value]) => ({
    name: `invalid record ${field}: ${JSON.stringify(value)}`,
    path: ["record_groups", "totals", "records", V2_ROOT, field],
    value,
  })),
  {
    name: "non-null policy uncertainty",
    path: ["policy_uncertainty"],
    value: 0,
  },
  {
    name: "missing selection adjustment",
    path: ["selection_adjustment"],
    value: false,
  },
  { name: "wrong scope", path: ["uncertainty_scope"], value: "calibrated" },
  { name: "null qualifications", path: ["qualifications"], value: null },
  { name: "scalar qualifications", path: ["qualifications"], value: "none" },
  {
    name: "missing qualification",
    path: ["qualifications"],
    value: { crib: "text" },
  },
  { name: "empty qualification", path: ["qualifications", "scope"], value: "" },
  {
    name: "non-string qualification",
    path: ["qualifications", "scope"],
    value: 1,
  },
  {
    name: "null record",
    path: ["record_groups", "totals", "records", V2_ROOT],
    value: null,
  },
  {
    name: "impossible relation with an otherwise valid record",
    path: ["record_groups", "totals", "records"],
    value: {
      "A_2_Suited/Dealer/A/matching_discard_suit": {
        mu: 1,
        n: 4,
        reported_marginal_se: 0,
      },
      [V2_ROOT]: { mu: 0.03125, n: 4, reported_marginal_se: 0 },
    },
  },
];

export const V2_IDENTITIES = [
  [V2_ROOT, true],
  [V2_RELATION, true],
  ["bad", false],
  ["A_2_Suited/Dealer/K/non_matching_discard_suit", true],
  ["A_2_Suited/Dealer/K/matching_rank_1_suit", false],
  ["A_A_Unsuited/Dealer/K/non_matching_discard_suit", false],
  ["J_J_Unsuited/Dealer/K/matching_discard_suit", true],
  ["J_J_Unsuited/Dealer/J/matching_discard_suit", false],
  ["A_J_Unsuited/Dealer/K/non_matching_discard_suit", true],
  ["J_Q_Unsuited/Dealer/K/matching_rank_1_suit", true],
  ["J_Q_Unsuited/Dealer/J/matching_rank_1_suit", false],
  ["J_Q_Unsuited/Dealer/K/matching_rank_2_suit", true],
  ["J_Q_Unsuited/Dealer/Q/matching_rank_2_suit", false],
  ["J_Q_Unsuited/Dealer/K/matching_discard_suit", false],
  ["A_2_Unsuited/Dealer/K/non_matching_discard_suit", false],
] as const;

export const rejectedV2Document = (
  vocabulary: object,
  path: readonly string[],
  value: unknown,
) => {
  const doc = v2Document(vocabulary);
  setV2Path(doc, path, value);
  return doc;
};

export const v2Diagnostics = (vocabulary: object, seed: number | null) => {
  const doc = v2Document(vocabulary);
  doc.provenance.seed = seed;
  doc.provenance.bootstrap_sha256 = "3".repeat(64);
  Object.assign(doc.provenance, {
    convergence_shift: 0,
    extra: true,
    precut_resolved_negative: 0,
    precut_resolved_positive: 1,
    precut_unresolved: 0,
  });
  return doc;
};
