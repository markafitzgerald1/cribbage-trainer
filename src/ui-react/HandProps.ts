import type { ComparableCard } from "../ui/sortCards";
import { SortOrder } from "../ui/SortOrder";

export interface DiscardableComparableCard extends ComparableCard {
  kept: boolean;
}

export interface HandProps {
  readonly dealtCards: readonly DiscardableComparableCard[];
  // Unique per-hand instance identifier to isolate card DOM keys across deals.
  readonly handId?: string | null | undefined;
  // Locks every card checkbox — see HandCard's `disabled`.
  readonly locked?: boolean;
  readonly onChange: (dealOrderIndex: number) => void;
  readonly sortOrder: SortOrder;
}
