/* eslint-disable sort-keys */
export const SortOrder = {
  DealOrder: 0,
  Descending: 1,
  Ascending: 2,
} as const;
/* eslint-enable sort-keys */
export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];
