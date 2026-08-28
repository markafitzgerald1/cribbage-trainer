// Shared by every stored-number check that must reject NaN, Infinity, and negative values, not just wrong JavaScript types.
export const isFiniteNonNegative = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
