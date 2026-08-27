import type React from "react";

export interface DialogFilterOption<T extends string> {
  readonly label: string;
  readonly value: T;
}

export interface DialogFilterGroupProps<T extends string> {
  readonly classes: {
    readonly filterGroup: string;
    readonly input: string;
    readonly option: string;
  };
  readonly currentValue: T;
  readonly groupName: string;
  readonly legendText: string;
  readonly onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly options: readonly DialogFilterOption<T>[];
}

export function DialogFilterGroup<T extends string>({
  classes,
  currentValue,
  groupName,
  legendText,
  onChange,
  options,
}: DialogFilterGroupProps<T>): React.JSX.Element {
  return (
    <fieldset className={classes.filterGroup}>
      <legend>{legendText}</legend>
      {options.map((option) => {
        const id = `${groupName}-${option.value}`;
        return (
          <span key={option.value}>
            <input
              checked={currentValue === option.value}
              className={classes.input}
              id={id}
              name={groupName}
              onChange={onChange}
              type="radio"
              value={option.value}
            />
            <label
              className={classes.option}
              htmlFor={id}
            >
              {option.label}
            </label>
          </span>
        );
      })}
    </fieldset>
  );
}

export const DIALOG_ROLE_OPTIONS: readonly DialogFilterOption<
  "all" | "dealer" | "pone"
>[] = [
  { label: "All", value: "all" },
  { label: "Dealer", value: "dealer" },
  { label: "Pone", value: "pone" },
];
