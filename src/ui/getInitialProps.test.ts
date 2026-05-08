import { describe, expect, it } from "@jest/globals";
import { getInitialProps } from "./getInitialProps";

describe("getInitialProps", () => {
  it("returns null initialCards when no hand param is present", () => {
    const props = getInitialProps("?seed=123");

    expect(props.initialCards).toBeNull();
    expect(props.seed).toBe("123");
  });

  it("returns parsed initialCards when hand param is present", () => {
    const props = getInitialProps("?hand=AH,2H,3H,4H,5H,6H");

    expect(props.initialCards?.[0]?.rankLabel).toBe("A");
  });

  it("returns null seed when no seed param is present", () => {
    const props = getInitialProps("");

    expect(props.seed).toBeNull();
  });
});
