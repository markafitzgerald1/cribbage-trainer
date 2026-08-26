/* jscpd:ignore-start */
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, renderHook } from "@testing-library/react";
import { useCloseOnEscape } from "./useCloseOnEscape";

describe("useCloseOnEscape", () => {
  it("invokes onClose when Escape key is pressed while shown", () => {
    const onClose = jest.fn();
    renderHook(() => {
      useCloseOnEscape(true, onClose);
    });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not invoke onClose when another key is pressed", () => {
    const onClose = jest.fn();
    renderHook(() => {
      useCloseOnEscape(true, onClose);
    });

    fireEvent.keyDown(document, { key: "Tab" });

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not attach listener when show is false", () => {
    const onClose = jest.fn();
    renderHook(() => {
      useCloseOnEscape(false, onClose);
    });

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onClose).not.toHaveBeenCalled();
  });
});
/* jscpd:ignore-end */
