import * as buttonClasses from "./DealButton.module.css";

interface DealButtonProps {
  readonly onDeal: () => void;
}

export function DealButton({ onDeal }: DealButtonProps) {
  return (
    <button
      className={buttonClasses.dealButton}
      onClick={onDeal}
      type="button"
    >
      Deal
    </button>
  );
}
