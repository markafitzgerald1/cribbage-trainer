import {
  DECISION_QUALITY_MEASUREMENT,
  acceptedMeasurementsKey,
  analyticsConsentKey,
  answeredPolicyVersionKey,
  clearAnalyticsChoice,
  declinedMeasurementsKey,
  readAnalyticsChoice,
  storeAnalyticsChoice,
  storeMeasurementAccepted,
  storePolicyUpdateChoice,
} from "./analyticsConsent";
import { describe, expect, it } from "@jest/globals";

const UNANSWERED = {
  consented: null,
  decisionQualityConsented: false,
  needsPolicyUpdateChoice: false,
};

const choiceOf = (
  consented: boolean,
  decisionQualityConsented: boolean,
  needsPolicyUpdateChoice = false,
) => ({ consented, decisionQualityConsented, needsPolicyUpdateChoice });

// A browser that answered the policy in force before decision-quality collection existed.
const startWithEarlierChoice = (consent: boolean) => {
  clearAnalyticsChoice();
  localStorage.setItem(analyticsConsentKey, JSON.stringify(consent));
};

describe("analytics choice storage", () => {
  it("reads an unanswered browser as owing nothing yet", () => {
    clearAnalyticsChoice();

    expect(readAnalyticsChoice()).toStrictEqual(UNANSWERED);
  });

  it("grants what this policy describes when analytics is accepted", () => {
    clearAnalyticsChoice();

    expect(storeAnalyticsChoice(true)).toStrictEqual(choiceOf(true, true));
    expect(localStorage.getItem(answeredPolicyVersionKey)).not.toBeNull();
  });

  it("grants nothing when analytics is declined outright", () => {
    clearAnalyticsChoice();

    expect(storeAnalyticsChoice(false)).toStrictEqual(choiceOf(false, false));
    expect(localStorage.getItem(acceptedMeasurementsKey)).toBeNull();
  });

  it.each([
    { consent: true, expected: true, name: "accepted" },
    // Nothing to ask a browser that collects nothing, and an Accept would turn analytics itself back on.
    { consent: false, expected: false, name: "declined" },
  ])(
    "asks a browser that $name analytics under an earlier policy: $expected",
    ({ consent, expected }) => {
      startWithEarlierChoice(consent);

      expect(readAnalyticsChoice()).toStrictEqual(
        choiceOf(consent, false, expected),
      );
    },
  );

  // Either answer settles the addition alone: the analytics consent given under the earlier policy keeps its own value.
  it.each([
    { accepted: true, name: "grants the measurement this policy added" },
    { accepted: false, name: "grants nothing" },
  ])("answering the update $name", ({ accepted }) => {
    startWithEarlierChoice(true);

    expect(storePolicyUpdateChoice(accepted)).toStrictEqual(
      choiceOf(true, accepted),
    );
    expect(localStorage.getItem(analyticsConsentKey)).toBe("true");
  });

  /*
   * The decline is recorded against the measurement, not inferred from a
   * version. That is what stops a later policy's acceptance — which asks only
   * about what that policy adds — from granting this one behind the user.
   */
  it("records a declined measurement by name", () => {
    startWithEarlierChoice(true);
    storePolicyUpdateChoice(false);

    expect(localStorage.getItem(declinedMeasurementsKey)).toBe(
      DECISION_QUALITY_MEASUREMENT,
    );
  });

  it("keeps a declined measurement declined when analytics is turned on again", () => {
    startWithEarlierChoice(true);
    storePolicyUpdateChoice(false);
    storeAnalyticsChoice(false);

    expect(storeAnalyticsChoice(true).decisionQualityConsented).toBe(false);
  });

  it("grants a single measurement from analytics settings", () => {
    startWithEarlierChoice(true);
    storePolicyUpdateChoice(false);

    expect(
      storeMeasurementAccepted(DECISION_QUALITY_MEASUREMENT)
        .decisionQualityConsented,
    ).toBe(true);
    expect(localStorage.getItem(declinedMeasurementsKey)).toBe("");
  });

  it("withholds a granted measurement once analytics itself is withdrawn", () => {
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

    expect(localStorage.getItem(acceptedMeasurementsKey)).toBeNull();
    expect(readAnalyticsChoice()).toStrictEqual(UNANSWERED);
  });
});
