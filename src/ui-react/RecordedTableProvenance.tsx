import * as classes from "./RecordedTableProvenance.module.css";
import {
  type TableIdentity,
  sameTableIdentity,
  shippedTableIdentity,
} from "../game/tableIdentity";
import type React from "react";

const FINGERPRINT_PREVIEW_LENGTH = 12;

const renderTableFingerprint = (
  role: "Crib" | "Play",
  digest: string,
): React.JSX.Element => {
  const preview = digest.slice(0, FINGERPRINT_PREVIEW_LENGTH);
  return (
    <div
      aria-label={`${role} table fingerprint ${preview}`}
      role="note"
      title={digest}
    >
      {role}: {preview}…
    </div>
  );
};

export interface RecordedTableProvenanceProps {
  readonly identity: TableIdentity | null;
}

export function RecordedTableProvenance({
  identity,
}: RecordedTableProvenanceProps): React.JSX.Element {
  if (identity === null) return <span>Original tables unknown</span>;
  return (
    <details className={classes.provenance}>
      <summary>
        {sameTableIdentity(identity, shippedTableIdentity)
          ? "Judged with current tables"
          : "Judged with different tables"}
      </summary>
      <div>Table fingerprints (for bug reports)</div>
      {renderTableFingerprint("Crib", identity.crib.means_sha256)}
      {renderTableFingerprint("Play", identity.play.means_sha256)}
    </details>
  );
}
