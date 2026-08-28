// Shared by every unknown-storage type guard that needs to rule out null and primitives before narrowing further.
export const isObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null;
