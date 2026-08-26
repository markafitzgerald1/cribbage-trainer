import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, renderHook } from "@testing-library/react";
import { useCloseOnEscape } from "./useCloseOnEscape";

describe("useCloseOnEscape", () => {
  const triggerKey = (show: boolean, key: string) => {
    const onClose = jest.fn();
    renderHook(() => {
      useCloseOnEscape(show, onClose);
    });
    fireEvent.keyDown(document, { key });
    return onClose;
  };

  it("invokes onClose when Escape key is pressed while shown", () => {
    const onClose = triggerKey(true, "Escape");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not invoke onClose when another key is pressed", () => {
    const onClose = triggerKey(true, "Tab");

    expect(onClose).not.toHaveBeenCalled();
  });

  it("does not attach listener when show is false", () => {
    const onClose = triggerKey(false, "Escape");

    expect(onClose).not.toHaveBeenCalled();
  });
});
