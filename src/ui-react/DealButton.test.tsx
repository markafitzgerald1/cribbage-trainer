import { describe, expect, it, jest } from "@jest/globals";
import { DealButton } from "./DealButton";
import { render } from "@testing-library/react";

describe("deal button component", () => {
  it("contains a button with text 'Deal'", () => {
    const button = render(<DealButton onDeal={jest.fn()} />);

    expect(button.queryByRole("button", { name: "Deal" })).toBeTruthy();
  });

  it("calls the onDeal callback when clicked", () => {
    const onDeal = jest.fn();
    const button = render(<DealButton onDeal={onDeal} />);

    button.getByRole("button", { name: "Deal" }).click();

    expect(onDeal).toHaveBeenCalledWith(expect.any(Object));
  });
});
