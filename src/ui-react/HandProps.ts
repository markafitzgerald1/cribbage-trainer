import type { ComparableCard } from "../ui/sortCards";
import { SortOrder } from "../ui/SortOrder";

export interface DiscardableComparableCard extends ComparableCard {
  kept: boolean;
}

export interface HandProps {
  readonly dealtCards: readonly DiscardableComparableCard[];
  readonly onChange: (dealOrderIndex: number) => void;
  readonly sortOrder: SortOrder;
}
