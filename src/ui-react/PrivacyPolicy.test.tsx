import { describe, expect, it } from "@jest/globals";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { render } from "@testing-library/react";

describe("privacy policy component", () => {
  it.each([
    "Privacy Policy",
    "cookies",
    "identifiers",
    "device",
    "Google Analytics",
  ])("contains the text %s", (substring) => {
    expect(render(<PrivacyPolicy />).container.textContent).toMatch(
      new RegExp(substring, "ui"),
    );
  });
});
