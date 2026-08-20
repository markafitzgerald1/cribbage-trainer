/*
 * The privacy policy's own version, stored with the answer given to it. A
 * policy that widens collection can then ask again for the part it added
 * without discarding the answer already given to the narrower one, which is
 * what rotating the consent key would do.
 */
export const PRIVACY_POLICY_VERSION = "2026-08-19";

/*
 * The policy version that introduced decision-quality collection, frozen at
 * that value. It must never be made to track PRIVACY_POLICY_VERSION: the next
 * additive update would then revoke a consent already given, because an
 * acceptance stored under this policy would stop matching the latest one, and
 * declining only what that later policy adds would leave this measurement off
 * for good. Versions are zero-padded ISO dates precisely so "the acceptance
 * came at or after this" is a plain string comparison.
 */
const DECISION_QUALITY_POLICY_VERSION = "2026-08-19";

export const analyticsConsentKey = "analyticsConsent-2026-07-23";
const legacyAnalyticsConsentKey = "analyticsConsent";
export const acceptedPolicyVersionKey = "analyticsPolicyAccepted";
export const answeredPolicyVersionKey = "analyticsPolicyAnswered";

export interface AnalyticsChoice {
  // Consent to analytics itself, which every event from #250 follows.
  readonly consented: boolean | null;
  // Consent to the decision-quality collection the current policy adds.
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

export const readAnalyticsChoice = (): AnalyticsChoice => {
  const consented = readConsent();
  return {
    consented,
    decisionQualityConsented:
      consented === true &&
      (localStorage.getItem(acceptedPolicyVersionKey) ?? "") >=
        DECISION_QUALITY_POLICY_VERSION,
    needsPolicyUpdateChoice:
      consented === true &&
      localStorage.getItem(answeredPolicyVersionKey) !== PRIVACY_POLICY_VERSION,
  };
};

export const storeAnalyticsChoice = (consented: boolean): AnalyticsChoice => {
  localStorage.setItem(analyticsConsentKey, JSON.stringify(consented));
  localStorage.setItem(answeredPolicyVersionKey, PRIVACY_POLICY_VERSION);
  if (consented) {
    localStorage.setItem(acceptedPolicyVersionKey, PRIVACY_POLICY_VERSION);
  }
  return readAnalyticsChoice();
};

/*
 * Declining what the current policy adds answers that policy and nothing
 * else: analytics consent given under an earlier one keeps its own value, so
 * the events disclosed there keep flowing exactly as before.
 */
export const storePolicyUpdateDecline = (): AnalyticsChoice => {
  localStorage.setItem(answeredPolicyVersionKey, PRIVACY_POLICY_VERSION);
  return readAnalyticsChoice();
};

/*
 * Exported for the specs and stories that need a browser which has never
 * answered; the trainer itself only ever replaces a choice, never forgets one.
 */
export const clearAnalyticsChoice = () => {
  localStorage.removeItem(analyticsConsentKey);
  localStorage.removeItem(acceptedPolicyVersionKey);
  localStorage.removeItem(answeredPolicyVersionKey);
};
