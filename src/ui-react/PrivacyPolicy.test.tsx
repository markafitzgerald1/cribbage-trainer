import { describe, expect, it } from "@jest/globals";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { render } from "@testing-library/react";

describe("privacy policy component", () => {
  const renderPolicyText = () =>
    render(<PrivacyPolicy />).container.textContent?.toLocaleLowerCase();

  it.each([
    "Privacy Policy",
    "cookies",
    "independent developer in Canada",
    "operator is responsible for privacy",
    "mark.a.fitzgerald+cribbage.trainer@gmail.com",
    "legal basis",
    "international processing",
    "14 months",
    "13 months",
    "applicable rights",
    "Office of the Privacy Commissioner of Canada",
    "device",
    "Google Analytics",
    "IP address",
    "screen resolution",
    "URL query",
  ])("contains the text %s", (substring) => {
    expect(renderPolicyText()).toContain(substring.toLocaleLowerCase());
  });

  it.each(["Mark Fitzgerald", "Ontario"])(
    "does not publish the personal detail %s",
    (substring) => {
      expect(renderPolicyText()).not.toContain(substring.toLocaleLowerCase());
    },
  );
});
