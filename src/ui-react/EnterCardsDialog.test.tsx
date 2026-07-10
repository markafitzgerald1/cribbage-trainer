/* jscpd:ignore-start */
import "@testing-library/jest-dom";
import "@testing-library/jest-dom/jest-globals";
import {
  CribRole,
  type CribRole as CribRoleType,
} from "../game/expectedCribPoints";
import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render } from "@testing-library/react";
import { DECK } from "../game/Card";
import { EnterCardsDialog } from "./EnterCardsDialog";
import { SortOrder } from "../ui/SortOrder";
/* jscpd:ignore-end */

const initialCards = DECK.slice(0, 6);

const renderDialog = (
  show = true,
  initialCribRole: CribRoleType = CribRole.Dealer,
) => {
  const onClose = jest.fn();
  const onSubmit = jest.fn();
  const rendered = render(
    <EnterCardsDialog
      initialCards={initialCards}
      initialCribRole={initialCribRole}
      onClose={onClose}
      onSubmit={onSubmit}
      show={show}
      sortOrder={SortOrder.Descending}
    />,
  );
  return { onClose, onSubmit, rendered };
};

const toggleCard = (rendered: ReturnType<typeof render>, name: string) => {
  fireEvent.click(rendered.getByRole("button", { name }));
};

const rerenderDialog = (rendered: ReturnType<typeof render>, show: boolean) => {
  rendered.rerender(
    <EnterCardsDialog
      initialCards={initialCards}
      initialCribRole={CribRole.Dealer}
      key={show ? "shown" : "hidden"}
      onClose={jest.fn()}
      onSubmit={jest.fn()}
      show={show}
      sortOrder={SortOrder.Descending}
    />,
  );
};

const CLOSE_ACTIONS = [
  {
    close: (rendered: ReturnType<typeof render>) => {
      fireEvent.click(rendered.getByRole("button", { name: "Close modal" }));
    },
    name: "the close button",
  },
  {
    close: () => {
      fireEvent.keyDown(document, { key: "Escape" });
    },
    name: "Escape",
  },
];

describe("enter cards dialog", () => {
  it("does not render when hidden", () => {
    const { rendered } = renderDialog(false);

    expect(rendered.queryByRole("heading", { name: "Enter cards" })).toBeNull();
  });

  it("prefills the six cards and role", () => {
    const { rendered } = renderDialog(true, CribRole.Pone);

    expect(rendered.getByText("6 of 6")).toBeInTheDocument();
    expect(rendered.getByRole("radio", { name: "Pone" })).toBeChecked();
  });

  it("displays selected cards in the active sort order", () => {
    const { rendered } = renderDialog();

    expect(rendered.getByText("6 of 6").parentElement).toHaveTextContent(
      "6 of 66♣5♣4♣3♣2♣A♣",
    );
  });

  it("clears all selected cards and disables submission", () => {
    const { rendered } = renderDialog();

    fireEvent.click(rendered.getByRole("button", { name: "Clear" }));

    expect(rendered.getByText("0 of 6")).toBeInTheDocument();
    expect(rendered.getByRole("button", { name: "Analyze" })).toBeDisabled();
    expect(rendered.getByRole("button", { name: "Clear" })).toBeDisabled();
  });

  it("submits selected cards in pick order with the selected role", () => {
    const { onSubmit, rendered } = renderDialog();

    toggleCard(rendered, "A♣");
    toggleCard(rendered, "7♣");
    fireEvent.click(rendered.getByRole("radio", { name: "Pone" }));
    fireEvent.click(rendered.getByRole("button", { name: "Analyze" }));

    expect(onSubmit).toHaveBeenCalledWith(
      [...initialCards.slice(1), DECK[6]],
      CribRole.Pone,
    );
  });

  it.each(CLOSE_ACTIONS)(
    "calls close via $name without submitting",
    ({ close }) => {
      const { onClose, onSubmit, rendered } = renderDialog();

      toggleCard(rendered, "A♣");
      close(rendered);

      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onSubmit).not.toHaveBeenCalled();
    },
  );

  it("ignores keys other than Escape", () => {
    const { onClose, rendered } = renderDialog();

    fireEvent.keyDown(document, { key: "Enter" });

    expect(onClose).not.toHaveBeenCalled();
    expect(
      rendered.getByRole("heading", { name: "Enter cards" }),
    ).toBeInTheDocument();
  });

  it("discards abandoned edits when reopened", () => {
    const { rendered } = renderDialog();
    toggleCard(rendered, "A♣");

    rerenderDialog(rendered, false);
    rerenderDialog(rendered, true);

    expect(rendered.getByText("6 of 6")).toBeInTheDocument();
  });
});
