import { describe, expect, it } from "@jest/globals";
import { PrivacyPolicy } from "./PrivacyPolicy";
import { render } from "@testing-library/react";

describe("privacy policy component", () => {
  it.each([
    "Privacy Policy",
    "cookies",
    "cookieless",
    "identifiers",
    "device",
    "Google Analytics",
    "IP address",
    "modeling",
    "new analytics choice",
    "screen resolution",
    "URL query",
  ])("contains the text %s", (substring) => {
    expect(render(<PrivacyPolicy />).container.textContent).toMatch(
      new RegExp(substring, "ui"),
    );
  });
});
