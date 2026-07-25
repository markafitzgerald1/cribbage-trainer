import { describe, expect, it } from "@jest/globals";
import { clearGoogleAnalyticsCookies } from "./clearGoogleAnalyticsCookies";

describe("clearGoogleAnalyticsCookies", () => {
  it("removes Google Analytics cookies without removing unrelated cookies", () => {
    // The unrelated cookie goes first so both analytics cookies are parsed from a segment carrying the "; " separator's space.
    document.cookie = "unrelated=value; Path=/";
    document.cookie = "_ga=client-id; Path=/";
    document.cookie = "_ga_TEST=session-id; Path=/";

    clearGoogleAnalyticsCookies();
    const remainingCookies = document.cookie;
    document.cookie = "unrelated=; Max-Age=0; Path=/";

    expect(remainingCookies).not.toContain("_ga");
    expect(remainingCookies).toContain("unrelated=value");
  });
});
