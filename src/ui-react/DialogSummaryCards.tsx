import type React from "react";

export interface DialogSummaryMetric {
  readonly accessibleValue?: string;
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
      {metrics.map((metric) => (
        <div
          className={classes.summaryCard}
          key={metric.label}
        >
          <span className={classes.summaryLabel}>{metric.label}</span>
          {metric.accessibleValue ? (
            <span
              aria-label={metric.accessibleValue}
              className={classes.summaryValue}
              role="note"
            >
              {metric.value}
            </span>
          ) : (
            <span className={classes.summaryValue}>{metric.value}</span>
          )}
        </div>
      ))}
    </div>
  );
}
