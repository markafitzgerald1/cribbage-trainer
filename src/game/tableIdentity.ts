import { isObject } from "../ui/isObject";
import shippedIdentity from "virtual:expected-table-identity";

export interface TableIdentity {
  readonly crib: { readonly means_sha256: string };
  readonly play: { readonly means_sha256: string };
}

const isMeansIdentity = (value: unknown): value is TableIdentity["crib"] =>
  isObject(value) &&
  typeof (value as TableIdentity["crib"]).means_sha256 === "string" &&
  /^[0-9a-f]{64}$/u.test((value as TableIdentity["crib"]).means_sha256);

export const normalizeTableIdentity = (value: unknown): TableIdentity | null =>
  isObject(value) &&
  isMeansIdentity((value as TableIdentity).crib) &&
  isMeansIdentity((value as TableIdentity).play)
    ? (value as TableIdentity)
    : null;

export const sameTableIdentity = (one: TableIdentity, other: TableIdentity) =>
  one.crib.means_sha256 === other.crib.means_sha256 &&
  one.play.means_sha256 === other.play.means_sha256;

export const shippedTableIdentity: TableIdentity = shippedIdentity;
