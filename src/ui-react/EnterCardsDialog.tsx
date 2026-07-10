import * as classes from "./EnterCardsDialog.module.css";
import { type Card, isSamePhysicalCard } from "../game/Card";
import {
  CribRole,
  type CribRole as CribRoleType,
} from "../game/expectedCribPoints";
import { useCallback, useEffect, useState } from "react";
import { CARDS_PER_DEALT_HAND } from "../game/facts";
import { CardGridPicker } from "./CardGridPicker";
import { CardLabel } from "./CardLabel";
import Modal from "./Modal";
import { SortOrder } from "../ui/SortOrder";
import { sortCards } from "../ui/sortCards";

export interface EnterCardsDialogProps {
  readonly initialCards: readonly Card[];
  readonly initialCribRole: CribRoleType;
  readonly onClose: () => void;
  readonly onSubmit: (cards: Card[], cribRole: CribRoleType) => void;
  readonly show: boolean;
  readonly sortOrder: SortOrder;
}

export function EnterCardsDialog({
  initialCards,
  initialCribRole,
  onClose,
  onSubmit,
  show,
  sortOrder,
}: EnterCardsDialogProps) {
  const [selectedCards, setSelectedCards] = useState<Card[]>([...initialCards]);
  const [cribRole, setCribRole] = useState<CribRoleType>(initialCribRole);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    if (show) {
      document.addEventListener("keydown", closeOnEscape);
    }
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose, show]);

  const toggleCard = useCallback((card: Card) => {
    setSelectedCards((currentCards) => {
      const selectedIndex = currentCards.findIndex((selectedCard) =>
        isSamePhysicalCard(selectedCard, card),
      );
      if (selectedIndex >= 0) {
        return currentCards.filter((_, index) => index !== selectedIndex);
      }
      return [...currentCards, card];
    });
  }, []);

  const changeRole = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setCribRole(event.currentTarget.value as CribRoleType);
    },
    [],
  );

  const renderRoleInput = () => (
    <fieldset className={classes.role}>
      <legend>Your role</legend>
      {[CribRole.Dealer, CribRole.Pone].map((role) => (
        <label key={role}>
          <input
            checked={cribRole === role}
            name="entered-crib-role"
            onChange={changeRole}
            type="radio"
            value={role}
          />
          {role}
        </label>
      ))}
    </fieldset>
  );

  const renderSelectedCards = () => (
    <div
      aria-live="polite"
      className={classes.selected}
    >
      <span className={classes.count}>{selectedCards.length} of 6</span>
      {sortCards(
        selectedCards.map((card, dealOrder) => ({ ...card, dealOrder })),
        sortOrder,
      ).map((card) => (
        <CardLabel
          key={`${card.rank}-${card.suit}`}
          rank={card.rank}
          suit={card.suit}
        />
      ))}
    </div>
  );

  const submit = useCallback(() => {
    onSubmit(selectedCards, cribRole);
  }, [cribRole, onSubmit, selectedCards]);

  return (
    <Modal
      onClose={onClose}
      show={show}
    >
      <div className={classes.dialog}>
        <h2 className={classes.title}>Enter cards</h2>
        {renderRoleInput()}
        {renderSelectedCards()}
        <CardGridPicker
          onToggle={toggleCard}
          selectedCards={selectedCards}
          selectionFull={selectedCards.length === CARDS_PER_DEALT_HAND}
        />
        <button
          className={classes.analyze}
          disabled={selectedCards.length !== CARDS_PER_DEALT_HAND}
          onClick={submit}
          type="button"
        >
          Analyze
        </button>
      </div>
    </Modal>
  );
}
