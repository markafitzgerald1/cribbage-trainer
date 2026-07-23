import { describe, expect, it } from "@jest/globals";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { render } from "@testing-library/react";

describe("privacy policy component", () => {
  it.each([
    "Privacy Policy",
    "cookies",
    "data controller",
    "Ontario",
    "mark.a.fitzgerald+cribbage.trainer@gmail.com",
    "legal basis",
    "international processing",
    "14 months",
    "13 months",
    "privacy rights",
    "Office of the Privacy Commissioner of Canada",
    "device",
    "Google Analytics",
    "IP address",
    "screen resolution",
    "URL query",
  ])("contains the text %s", (substring) => {
    expect(
      render(<PrivacyPolicy />).container.textContent?.toLocaleLowerCase(),
    ).toContain(substring.toLocaleLowerCase());
  });
});
