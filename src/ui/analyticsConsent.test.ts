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
  needsPolicyUpdateChoice: false,
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
      needsPolicyUpdateChoice: false,
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
      needsPolicyUpdateChoice: false,
    });
  });

  it.each([
    {
      expected: {
        consented: true,
        decisionQualityConsented: false,
        needsPolicyUpdateChoice: true,
      },
      name: "accepted",
      stored: "true",
    },
    {
      // Nothing to ask a browser that collects nothing, and an Accept would turn analytics itself back on.
      expected: {
        consented: false,
        decisionQualityConsented: false,
        needsPolicyUpdateChoice: false,
      },
      name: "declined",
      stored: "false",
    },
  ])(
    "reads a browser that $name analytics under an earlier policy",
    ({ expected, stored }) => {
      clearAnalyticsChoice();
      localStorage.setItem(analyticsConsentKey, stored);

      expect(readAnalyticsChoice()).toStrictEqual(expected);
    },
  );

  it("leaves the earlier acceptance untouched when the update is declined", () => {
    startWithEarlierAcceptance();

    expect(storePolicyUpdateDecline()).toStrictEqual({
      consented: true,
      decisionQualityConsented: false,
      needsPolicyUpdateChoice: false,
    });
    expect(localStorage.getItem(analyticsConsentKey)).toBe("true");
    expect(localStorage.getItem(acceptedPolicyVersionKey)).toBeNull();
  });

  /*
   * The stored acceptance is compared against the version that introduced the
   * measurement, not the latest one: a later additive policy asks only about
   * what it adds, so it must not revoke this.
   */
  it.each([
    {
      accepted: PRIVACY_POLICY_VERSION,
      expected: true,
      name: "the policy that introduced it",
    },
    {
      accepted: "2999-01-01",
      expected: true,
      name: "a policy later than that",
    },
    {
      accepted: "2026-07-23",
      expected: false,
      name: "a policy that predates it",
    },
  ])("reads an acceptance of $name as $expected", ({ accepted, expected }) => {
    clearAnalyticsChoice();
    localStorage.setItem(analyticsConsentKey, "true");
    localStorage.setItem(acceptedPolicyVersionKey, accepted);

    expect(readAnalyticsChoice().decisionQualityConsented).toBe(expected);
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
