import {
  PRIVACY_POLICY_VERSION,
  acceptedPolicyVersionKey,
  analyticsConsentKey,
  answeredPolicyVersionKey,
  clearAnalyticsChoice,
  readAnalyticsChoice,
  storeAnalyticsChoice,
  storePolicyUpdateDecline,
} from "./analyticsConsent";
import { describe, expect, it } from "@jest/globals";

const UNANSWERED = {
  consented: null,
  decisionQualityConsented: false,
  needsPolicyChoice: true,
};

// A browser that answered the policy in force before decision-quality collection existed.
const startWithEarlierAcceptance = () => {
  clearAnalyticsChoice();
  localStorage.setItem(analyticsConsentKey, "true");
};

describe("analytics choice storage", () => {
  it("reads an unanswered browser as owing a policy choice", () => {
    clearAnalyticsChoice();

    expect(readAnalyticsChoice()).toStrictEqual(UNANSWERED);
  });

  it("records acceptance against the current policy version", () => {
    clearAnalyticsChoice();

    expect(storeAnalyticsChoice(true)).toStrictEqual({
      consented: true,
      decisionQualityConsented: true,
      needsPolicyChoice: false,
    });
    expect(localStorage.getItem(acceptedPolicyVersionKey)).toBe(
      PRIVACY_POLICY_VERSION,
    );
  });

  it("answers the current policy when analytics is declined outright", () => {
    clearAnalyticsChoice();

    expect(storeAnalyticsChoice(false)).toStrictEqual({
      consented: false,
      decisionQualityConsented: false,
      needsPolicyChoice: false,
    });
  });

  it("keeps an earlier acceptance while asking about what the policy added", () => {
    startWithEarlierAcceptance();

    expect(readAnalyticsChoice()).toStrictEqual({
      consented: true,
      decisionQualityConsented: false,
      needsPolicyChoice: true,
    });
  });

  it("leaves the earlier acceptance untouched when the update is declined", () => {
    startWithEarlierAcceptance();

    expect(storePolicyUpdateDecline()).toStrictEqual({
      consented: true,
      decisionQualityConsented: false,
      needsPolicyChoice: false,
    });
    expect(localStorage.getItem(analyticsConsentKey)).toBe("true");
    expect(localStorage.getItem(acceptedPolicyVersionKey)).toBeNull();
  });

  it("withholds decision-quality collection once analytics itself is withdrawn", () => {
    clearAnalyticsChoice();
    storeAnalyticsChoice(true);

    expect(storeAnalyticsChoice(false).decisionQualityConsented).toBe(false);
  });

  it("forgets a malformed stored consent", () => {
    clearAnalyticsChoice();
    localStorage.setItem(analyticsConsentKey, "granted");

    expect(readAnalyticsChoice()).toStrictEqual(UNANSWERED);
    expect(localStorage.getItem(analyticsConsentKey)).toBeNull();
  });

  it("removes a consent stored under the superseded key", () => {
    clearAnalyticsChoice();
    localStorage.setItem("analyticsConsent", "true");

    expect(readAnalyticsChoice()).toStrictEqual(UNANSWERED);
    expect(localStorage.getItem("analyticsConsent")).toBeNull();
  });

  it("clears every part of a stored choice", () => {
    storeAnalyticsChoice(true);
    clearAnalyticsChoice();

    expect(localStorage.getItem(answeredPolicyVersionKey)).toBeNull();
    expect(readAnalyticsChoice()).toStrictEqual(UNANSWERED);
  });
});
