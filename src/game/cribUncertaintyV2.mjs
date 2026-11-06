export const CRIB_V2_SCHEMA = "expected-points-uncertainty.v2";
export const CRIB_V4_METHOD = "artifact_pipeline.generate_table.v4";
export const CRIB_V2_SAMPLE_UNIT = "independent-vector-rows-per-active-stream";

const digest = /^[0-9a-f]{64}$/u;
const unavailable = [
  "cross_bucket_covariance",
  "policy_uncertainty",
  "selection_adjustment",
  "calibrated_comparison_uncertainty",
];
const guardCounts = [
  "precut_resolved_positive",
  "precut_resolved_negative",
  "precut_unresolved",
];
const reservedProvenance = [
  "generation_accumulators",
  "estimator_state",
  "randomness_key",
];
const provenanceContracts = [
  ["generation_method", CRIB_V4_METHOD],
  ["estimator_contract", "shared-rank-relation-v1"],
  ["relation_centering_contract", "uniform-two-card-rank-completion-v1"],
  ["selector_contract", "legacy-suit-sensitive-first-max-v1"],
  ["rng_contract", "python-random-sample-v1"],
  ["sample_unit", CRIB_V2_SAMPLE_UNIT],
];
const qualificationKeys = ["crib", "scope"];
const recordFields = ["mu", "n", "reported_marginal_se"];
const minimumRows = 2;
const identityParts = 4;

const validDiagnostics = (provenance) => {
  const shift = provenance.convergence_shift;
  const counts = guardCounts.map((key) => Reflect.get(provenance, key));
  return (
    (!Object.hasOwn(provenance, "convergence_shift") ||
      (Number.isFinite(shift) && shift >= 0)) &&
    (!guardCounts.some((key) => Object.hasOwn(provenance, key)) ||
      counts.every((count) => Number.isSafeInteger(count) && count >= 0))
  );
};

const validProvenance = (provenance) =>
  provenance !== null &&
  typeof provenance === "object" &&
  provenanceContracts.every(
    ([field, value]) => Reflect.get(provenance, field) === value,
  ) &&
  Object.values(provenance).every(
    (value) =>
      value === null ||
      typeof value === "string" ||
      typeof value === "boolean" ||
      Number.isFinite(value),
  ) &&
  reservedProvenance.every((key) => !Object.hasOwn(provenance, key)) &&
  validDiagnostics(provenance) &&
  typeof provenance.policy_sha256 === "string" &&
  digest.test(provenance.policy_sha256) &&
  (provenance.bootstrap_sha256 === null ||
    (typeof provenance.bootstrap_sha256 === "string" &&
      digest.test(provenance.bootstrap_sha256))) &&
  Number.isSafeInteger(provenance.generation) &&
  provenance.generation >= 0 &&
  (provenance.seed === null || Number.isSafeInteger(provenance.seed));

const hasQualification = (qualifications, field) => {
  const text = Reflect.get(qualifications, field);
  return typeof text === "string" && text.length > 0;
};

export const validCribV2Header = (document) => {
  const { provenance, qualifications } = document;
  return (
    document.uncertainty_scope === "fixed-policy-sampling" &&
    unavailable.every((field) => Reflect.get(document, field) === null) &&
    validProvenance(provenance) &&
    qualifications !== null &&
    typeof qualifications === "object" &&
    Object.keys(qualifications).length === qualificationKeys.length &&
    qualificationKeys.every((field) => hasQualification(qualifications, field))
  );
};

export const validCribV2Record = (record) =>
  Object.keys(record).length === recordFields.length &&
  Number.isFinite(record.mu) &&
  Number.isSafeInteger(record.n) &&
  record.n >= minimumRows &&
  Number.isFinite(record.reported_marginal_se) &&
  record.reported_marginal_se >= 0;

export const validCribV2Identity = (identity) => {
  const parts = identity.split("/");
  if (parts.length !== identityParts) {
    return false;
  }
  const [discard, , rank, slot] = parts;
  if (slot === "total") {
    return true;
  }
  const [first, second, variant] = discard.split("_");
  if (variant === "Suited" || first === second) {
    return (
      (variant === "Suited" || first === "J") &&
      (slot === "non_matching_discard_suit" ||
        (slot === "matching_discard_suit" && rank !== first && rank !== second))
    );
  }
  return (
    (first === "J" || second === "J") &&
    (slot === "non_matching_discard_suit" ||
      (slot === "matching_rank_1_suit" && rank !== first) ||
      (slot === "matching_rank_2_suit" && rank !== second))
  );
};
