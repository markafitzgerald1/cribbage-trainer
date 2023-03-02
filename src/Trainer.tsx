// TODO: add linter TODO checks to project, build pipeline and GitHub Actions Workflow.
import React from "react";
import ReactDOMClient from "react-dom/client";

type DealtCard = {
  rankLabel: string;
  rankValue: number;
  count: number;
  kept: boolean;
  index: number;
};

type CardProps = {
  dealtCard: DealtCard;
  toggleKept: () => void;
};

function Card({ dealtCard: { kept, rankLabel }, toggleKept }: CardProps) {
  return (
    <li
      className={`card${kept ? "" : " discarded"}`}
      onClick={toggleKept}
    >
      {rankLabel}
    </li>
  );
}

type HandProps = {
  dealtCards: DealtCard[];
  toggleKept: (index: number) => void;
};

class Hand extends React.Component<HandProps> {
  constructor(props: HandProps) {
    super(props);
  }

  override render() {
    return (
      <ul className="hand">
        {/* TODO: auto-calculate as user clicks: post-cut hand value, pre-cut and opponent discard crib value, pre-cut crib value, pre-opponent discard crib value, post-cut and opponent discard crib value, sum of both */}
        {/* TODO: auto-analyze as user clicks: expected hand, crib values for each possible discard */}
        {this.props.dealtCards.map((dealtCard, index) => (
          <Card
            dealtCard={dealtCard}
            toggleKept={() => this.props.toggleKept(index)}
            key={dealtCard.index}
          />
        ))}
      </ul>
    );
  }
}

enum Sort {
  DealOrder,
  Descending,
  Ascending,
}

const SortLabel = {
  DealOrder: "↔️",
  Descending: "↘️",
  Ascending: "↗️",
};

type SortName = keyof typeof Sort;

class SortOrder extends React.Component<{
  sortOrder: Sort;
  setSortOrder: (sortOrder: SortName) => void;
}> {
  onChange = (e: React.FormEvent<HTMLInputElement>) => {
    this.props.setSortOrder(e.currentTarget.value as SortName);
  };

  override render() {
    return (
      <div className="sort-order">
        <span>Sort: </span>
        {Object.keys(Sort)
          .filter((key) => isNaN(Number(key)))
          .map((key) => key as SortName)
          .map((key) => (
            <span key={Sort[key]}>
              <input
                type="radio"
                id={key}
                name="sort"
                value={Sort[Sort[key]]}
                checked={this.props.sortOrder === Sort[key]}
                onChange={this.onChange}
              />
              <label htmlFor={key}>{SortLabel[key]}</label>
            </span>
          ))}
        <span className="sort-order-description">
          {" "}
          (
          {(Sort[this.props.sortOrder] as string)
            .replace(/([a-z])([A-Z])/, "$1 $2")
            .toLowerCase()}
          )
        </span>
      </div>
    );
  }
}

type KeepDiscard = {
  keep: DealtCard[];
  discard: DealtCard[];
};

function handToString(dealtCards: DealtCard[]) {
  return dealtCards.map((dealtCard) => dealtCard.rankLabel).join("");
}

type ScoredKeepDiscard = KeepDiscard & { points: number };

class Calculation extends React.Component<{
  scoredKeepDiscard: ScoredKeepDiscard;
}> {
  override render() {
    return (
      <div>
        <span className="keep-discard">
          {handToString(this.props.scoredKeepDiscard.keep)}
        </span>
        -
        <span className="keep-discard">
          {handToString(this.props.scoredKeepDiscard.discard)}
        </span>{" "}
        for {this.props.scoredKeepDiscard.points} points
      </div>
    );
  }
}

const POINTS = {
  PAIR: 2,
  FIFTEENS: 2,
  THREE_CARD_RUN: 3,
  FOUR_CARD_RUN: 4,
} as const;

const COUNT = {
  FIFTEEN: 15,
} as const;

class Calculations extends React.Component<{ dealtCards: DealtCard[] }> {
  override render() {
    return (
      <div className="calculations">
        {this.getAllKeepDiscardCombinations()
          .map((keepDiscard) => ({
            keep: keepDiscard.keep,
            discard: keepDiscard.discard,
            points: this.countPoints(keepDiscard.keep),
          }))
          .sort((a, b) => b.points - a.points)
          .map((scoredKeepDiscard) => (
            <Calculation
              scoredKeepDiscard={scoredKeepDiscard}
              key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
                .map((dealtCard) => dealtCard.rankLabel)
                .join("")}
            />
          ))}
      </div>
    );
  }

  countPoints(keep: DealtCard[]) {
    // TODO: unit test me
    let ans = 0;
    const keepCopy = [...keep].sort((a, b) => a.rankValue - b.rankValue);

    let threeRuns = 0,
      fourRuns = 0;
    for (let i = 0; i < keepCopy.length; i++) {
      const iCard = keepCopy[i] as DealtCard;
      for (let j = i + 1; j < keepCopy.length; j++) {
        const jCard = keepCopy[j] as DealtCard;
        if (iCard.rankValue === jCard.rankValue) {
          ans += POINTS.PAIR;
        }
        if (iCard.count + jCard.count == 15) {
          ans += POINTS.FIFTEENS;
        }
        for (let k = j + 1; k < keepCopy.length; k++) {
          const kCard = keepCopy[k] as DealtCard;
          if (iCard.count + jCard.count + kCard.count == COUNT.FIFTEEN) {
            ans += POINTS.FIFTEENS;
          }
          if (
            iCard.rankValue + 1 === jCard.rankValue &&
            jCard.rankValue + 1 === kCard.rankValue
          ) {
            threeRuns++;
          }
          for (let l = k + 1; l < keepCopy.length; l++) {
            const lCard = keepCopy[l] as DealtCard;
            if (
              iCard.count + jCard.count + kCard.count + lCard.count ==
              COUNT.FIFTEEN
            ) {
              ans += POINTS.FIFTEENS;
            }
            if (
              iCard.rankValue + 1 === jCard.rankValue &&
              jCard.rankValue + 1 === kCard.rankValue &&
              kCard.rankValue + 1 === lCard.rankValue
            ) {
              fourRuns++;
            }
          }
        }
      }
    }

    if (fourRuns) {
      ans += fourRuns * POINTS.FOUR_CARD_RUN;
    } else if (threeRuns) {
      ans += threeRuns * POINTS.THREE_CARD_RUN;
    }

    return ans;
  }

  getAllKeepDiscardCombinations() {
    // TODO: unit test this!
    const keepDiscards: KeepDiscard[] = [];
    const seenDiscards: Set<string> = new Set();
    for (let i = 0; i < this.props.dealtCards.length; i++) {
      const iCard = this.props.dealtCards[i] as DealtCard;
      const iLabel = iCard.rankLabel;
      for (let j = i + 1; j < this.props.dealtCards.length; j++) {
        const jCard = this.props.dealtCards[j] as DealtCard;
        const jLabel = jCard.rankLabel;
        const discard01 = iLabel + jLabel;
        const discard10 = jLabel + iLabel;
        if (!seenDiscards.has(discard01) && !seenDiscards.has(discard10)) {
          seenDiscards.add(discard01);
          seenDiscards.add(discard10);
          keepDiscards.push({
            keep: this.props.dealtCards.filter(
              (_, index) => index !== i && index !== j
            ),
            discard: [iCard, jCard],
          });
        }
      }
    }
    return keepDiscards;
  }
}

const CARD_LABELS = "A23456789TJQK";
const MAXIMUM_CARD_COUNTING_VALUE = 10;

class Trainer extends React.Component<
  Record<string, never>,
  {
    dealtCards: DealtCard[];
    sortOrder: Sort;
    showCalculations: boolean;
  }
> {
  constructor(props: Record<string, never>) {
    super(props);
    this.state = {
      dealtCards: Array.from({ length: 6 }, () =>
        Math.floor(Math.random() * 13)
      )
        .map((rankValue, index) => ({
          rankLabel: CARD_LABELS[rankValue] as string,
          rankValue,
          count: Math.min(rankValue + 1, MAXIMUM_CARD_COUNTING_VALUE),
          kept: true,
          index,
        }))
        .sort(this.descendingCompareFn),
      sortOrder: Sort.Descending,
      showCalculations: false,
    };
  }

  toggleKept = (index: number) => {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.state.dealtCards.length
    ) {
      throw Error(
        `Invalid dealtCards ${this.state.dealtCards} index ${index}.`
      );
    }

    this.setState((state) => {
      const dealtCard = state.dealtCards[index] as DealtCard;
      dealtCard.kept = !dealtCard.kept;
      return {
        dealtCards: state.dealtCards,
        showCalculations:
          state.dealtCards.filter((dealtCard) => !dealtCard.kept).length == 2,
      };
    });
  };

  descendingCompareFn = (a: DealtCard, b: DealtCard) =>
    b.rankValue - a.rankValue;

  setSortOrder = (sortOrder: SortName) => {
    this.setState((state) => {
      switch (Sort[sortOrder]) {
        case Sort.Ascending:
          state.dealtCards.sort((a, b) => a.rankValue - b.rankValue);
          break;
        case Sort.Descending:
          state.dealtCards.sort(this.descendingCompareFn);
          break;
        default:
          state.dealtCards.sort((a, b) => a.index - b.index);
          break;
      }
      return {
        sortOrder: Sort[sortOrder],
        dealtCards: state.dealtCards,
      };
    });
  };

  override render() {
    return (
      <React.StrictMode>
        <div>
          <SortOrder
            sortOrder={this.state.sortOrder}
            setSortOrder={this.setSortOrder}
          />
          <Hand
            dealtCards={this.state.dealtCards}
            toggleKept={this.toggleKept}
          />
          {!this.state.showCalculations || (
            <Calculations dealtCards={this.state.dealtCards} />
          )}
        </div>
      </React.StrictMode>
    );
  }
}

// TODO: add a test which would fail if I hand <React.StrictMode><Trainer /></React.StrictMode> to render()
ReactDOMClient.createRoot(
  document.querySelector("#trainer") ?? document.documentElement
).render(<Trainer />);
