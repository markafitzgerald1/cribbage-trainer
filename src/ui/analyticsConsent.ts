/*
 * The privacy policy's own version, stored with the answer given to it. A
 * policy that widens collection can then ask again for the part it added
 * without discarding the answer already given to the narrower one, which is
 * what rotating the consent key would do.
 */
export const PRIVACY_POLICY_VERSION = "2026-08-22";

export const DECISION_QUALITY_MEASUREMENT = "decisionQuality";

/*
 * Every measurement disclosed on its own, with the policy version that
 * introduced it. The invariant these exist to keep: a grant is recorded only
 * for a measurement the interaction actually disclosed. Deriving the gates
 * from one accepted version instead cannot represent selective answers — the
 * next additive update would revoke a measurement accepted earlier, or grant
 * one declined earlier, depending on which way the comparison ran.
 */
const gatedMeasurements = [
  { introducedIn: "2026-08-22", name: DECISION_QUALITY_MEASUREMENT },
] as const;

export const analyticsConsentKey = "analyticsConsent-2026-07-23";
const legacyAnalyticsConsentKey = "analyticsConsent";
export const acceptedMeasurementsKey = "analyticsAcceptedMeasurements";
export const declinedMeasurementsKey = "analyticsDeclinedMeasurements";
export const answeredPolicyVersionKey = "analyticsPolicyAnswered";

export interface AnalyticsChoice {
  // Consent to analytics itself, which every event from #250 follows.
  readonly consented: boolean | null;
  // Consent to the decision-quality collection this policy version adds.
  readonly decisionQualityConsented: boolean;
  /*
   * True only when analytics is on under an answer given to an earlier
   * policy, which is the one case with something to ask about. An unanswered
   * browser is asked the whole question instead, and a browser that declined
   * analytics is asked nothing: the addition lives inside analytics, which is
   * already off, so there is nothing to disclose and nothing to collect — and
   * an Accept here would silently turn analytics itself back on.
   */
  readonly needsPolicyUpdateChoice: boolean;
}

const readConsent = (): boolean | null => {
  localStorage.removeItem(legacyAnalyticsConsentKey);
  const storedConsent = localStorage.getItem(analyticsConsentKey);
  if (storedConsent === "true") {
    return true;
  }
  if (storedConsent === "false") {
    return false;
  }
  localStorage.removeItem(analyticsConsentKey);
  return null;
};

const readMeasurements = (key: string): readonly string[] =>
  (localStorage.getItem(key) ?? "").split(",").filter(Boolean);

const writeMeasurements = (key: string, names: readonly string[]) => {
  localStorage.setItem(key, [...new Set(names)].join(","));
};

// A measurement moves between the two lists rather than appearing in both, so the latest answer about it is the one that counts.
const recordMeasurementChoices = (
  accepted: readonly string[],
  declined: readonly string[],
) => {
  writeMeasurements(acceptedMeasurementsKey, [
    ...readMeasurements(acceptedMeasurementsKey).filter(
      (name) => !declined.includes(name),
    ),
    ...accepted,
  ]);
  writeMeasurements(declinedMeasurementsKey, [
    ...readMeasurements(declinedMeasurementsKey).filter(
      (name) => !accepted.includes(name),
    ),
    ...declined,
  ]);
};

export const readAnalyticsChoice = (): AnalyticsChoice => {
  const consented = readConsent();
  return {
    consented,
    decisionQualityConsented:
      consented === true &&
      readMeasurements(acceptedMeasurementsKey).includes(
        DECISION_QUALITY_MEASUREMENT,
      ),
    needsPolicyUpdateChoice:
      consented === true &&
      localStorage.getItem(answeredPolicyVersionKey) !== PRIVACY_POLICY_VERSION,
  };
};

export const storeAnalyticsChoice = (consented: boolean): AnalyticsChoice => {
  localStorage.setItem(analyticsConsentKey, JSON.stringify(consented));
  localStorage.setItem(answeredPolicyVersionKey, PRIVACY_POLICY_VERSION);
  if (consented) {
    /*
     * Turning analytics on accepts what this policy describes, except a
     * measurement the user has already declined on its own: that answer
     * stands until they revisit it in Analytics Settings, so toggling
     * analytics off and on cannot quietly undo it.
     */
    const declined = readMeasurements(declinedMeasurementsKey);
    recordMeasurementChoices(
      gatedMeasurements
        .map(({ name }) => name)
        .filter((name) => !declined.includes(name)),
      [],
    );
  }
  return readAnalyticsChoice();
};

/*
 * Answering the update answers what this policy version added, and nothing
 * else: analytics consent given under an earlier one keeps its own value, and
 * so does every measurement disclosed by an earlier policy.
 */
export const storePolicyUpdateChoice = (accepted: boolean): AnalyticsChoice => {
  /*
   * Read before the new answer is recorded, and compared against what this
   * browser last answered rather than against the newest release: a browser
   * that skipped a release entirely was never asked about what that release
   * introduced, and recording an answer to the current version would bury
   * the question for good. The comparison selects what to ask about; the
   * answer is still recorded against each measurement by name.
   */
  const previouslyAnswered =
    localStorage.getItem(answeredPolicyVersionKey) ?? "";
  localStorage.setItem(answeredPolicyVersionKey, PRIVACY_POLICY_VERSION);
  const added = gatedMeasurements
    .filter(({ introducedIn }) => introducedIn > previouslyAnswered)
    .map(({ name }) => name);
  recordMeasurementChoices(accepted ? added : [], accepted ? [] : added);
  return readAnalyticsChoice();
};

// Accepting one measurement from Analytics Settings grants that measurement and no other.
export const storeMeasurementAccepted = (name: string): AnalyticsChoice => {
  recordMeasurementChoices([name], []);
  return readAnalyticsChoice();
};

/*
 * Exported for the specs and stories that need a browser which has never
 * answered; the trainer itself only ever replaces a choice, never forgets one.
 */
export const clearAnalyticsChoice = () => {
  localStorage.removeItem(analyticsConsentKey);
  localStorage.removeItem(acceptedMeasurementsKey);
  localStorage.removeItem(declinedMeasurementsKey);
  localStorage.removeItem(answeredPolicyVersionKey);
};
