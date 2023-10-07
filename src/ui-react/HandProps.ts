import { DealtCardsHook } from "./DealtCardsHook";
import { SortOrder } from "../ui/SortOrder";

export interface HandProps extends DealtCardsHook {
  readonly sortOrder: SortOrder;
}
