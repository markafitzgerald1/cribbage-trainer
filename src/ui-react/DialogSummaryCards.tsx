import type React from "react";

export interface DialogSummaryMetric {
  readonly accessibleValue?: string | null;
  readonly label: string;
  readonly value: number | string;
}

export interface DialogSummaryCardsProps {
  readonly classes: {
    readonly summaryCard: string;
    readonly summaryCards: string;
    readonly summaryLabel: string;
    readonly summaryValue: string;
  };
  readonly metrics: readonly DialogSummaryMetric[];
}

export function DialogSummaryCards({
  classes,
  metrics,
}: DialogSummaryCardsProps): React.JSX.Element {
  return (
    <div className={classes.summaryCards}>
      {metrics.map(({ accessibleValue, label, value }) => {
        const name = accessibleValue ?? null;
        const hasAccessibleValue = name !== null;
        return (
          <div
            className={classes.summaryCard}
            key={label}
          >
            <span className={classes.summaryLabel}>{label}</span>
            {hasAccessibleValue ? (
              <span
                aria-label={name}
                className={classes.summaryValue}
                role="note"
              >
                {value}
              </span>
            ) : (
              <span className={classes.summaryValue}>{value}</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
