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

function Hand({ dealtCards, toggleKept }: HandProps) {
  return (
    <ul className="hand">
      {/* TODO: auto-calculate as user clicks: post-cut hand value, pre-cut and opponent discard crib value, pre-cut crib value, pre-opponent discard crib value, post-cut and opponent discard crib value, sum of both */}
      {/* TODO: auto-analyze as user clicks: expected hand, crib values for each possible discard */}
      {dealtCards.map((dealtCard, index) => (
        <Card
          dealtCard={dealtCard}
          key={dealtCard.index}
          toggleKept={() => toggleKept(index)}
        />
      ))}
    </ul>
  );
}

enum Sort {
  DealOrder,
  Descending,
  Ascending,
}

const SortLabel = {
  Ascending: "↗️",
  DealOrder: "↔️",
  Descending: "↘️",
};

type SortName = keyof typeof Sort;

class SortOrder extends React.Component<{
  sortOrder: Sort;
  setSortOrder: (sortOrder: SortName) => void;
}> {
  handleChange = (event: React.FormEvent<HTMLInputElement>) => {
    this.props.setSortOrder(event.currentTarget.value as SortName);
  };

  override render() {
    const { sortOrder } = this.props;
    return (
      <div className="sort-order">
        <span>Sort: </span>
        {Object.keys(Sort)
          .filter((key) => isNaN(Number(key)))
          .map((key) => key as SortName)
          .map((key) => (
            <span key={Sort[key]}>
              <input
                checked={sortOrder === Sort[key]}
                id={key}
                name="sort"
                onChange={this.handleChange}
                type="radio"
                value={Sort[Sort[key]]}
              />
              <label htmlFor={key}>{SortLabel[key]}</label>
            </span>
          ))}
        <span className="sort-order-description">
          {" "}
          (
          {(Sort[sortOrder] as string)
            .replace(
              /(?<lastLower>[a-z])(?<nextFirstUpper>[A-Z])/u,
              "$<lastLower> $<nextFirstUpper>"
            )
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
    const {
      scoredKeepDiscard: { keep, discard, points },
    } = this.props;
    return (
      <div>
        <span className="keep-discard">{handToString(keep)}</span>-
        <span className="keep-discard">{handToString(discard)}</span> for{" "}
        {points} points
      </div>
    );
  }
}

const POINTS = {
  FIFTEENS: 2,
  FOUR_CARD_RUN: 4,
  PAIR: 2,
  THREE_CARD_RUN: 3,
} as const;

const COUNT = {
  FIFTEEN: 15,
} as const;

class Calculations extends React.Component<{ dealtCards: DealtCard[] }> {
  static countPoints(keep: DealtCard[]) {
    // TODO: unit test me
    let ans = 0;
    const keepCopy = [...keep].sort(
      (first, second) => first.rankValue - second.rankValue
    );

    let threeRuns = 0;
    let fourRuns = 0;
    for (let index1 = 0; index1 < keepCopy.length; index1 += 1) {
      const card1 = keepCopy[index1] as DealtCard;
      for (let index2 = index1 + 1; index2 < keepCopy.length; index2 += 1) {
        const card2 = keepCopy[index2] as DealtCard;
        if (card1.rankValue === card2.rankValue) {
          ans += POINTS.PAIR;
        }
        if (card1.count + card2.count === COUNT.FIFTEEN) {
          ans += POINTS.FIFTEENS;
        }
        for (let index3 = index2 + 1; index3 < keepCopy.length; index3 += 1) {
          const card3 = keepCopy[index3] as DealtCard;
          if (card1.count + card2.count + card3.count === COUNT.FIFTEEN) {
            ans += POINTS.FIFTEENS;
          }
          if (
            card1.rankValue + 1 === card2.rankValue &&
            card2.rankValue + 1 === card3.rankValue
          ) {
            threeRuns += 1;
          }
          for (let index4 = index3 + 1; index4 < keepCopy.length; index4 += 1) {
            const card4 = keepCopy[index4] as DealtCard;
            if (
              card1.count + card2.count + card3.count + card4.count ===
              COUNT.FIFTEEN
            ) {
              ans += POINTS.FIFTEENS;
            }
            if (
              card1.rankValue + 1 === card2.rankValue &&
              card2.rankValue + 1 === card3.rankValue &&
              card3.rankValue + 1 === card4.rankValue
            ) {
              fourRuns += 1;
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
    const { dealtCards } = this.props;
    for (let index1 = 0; index1 < dealtCards.length; index1 += 1) {
      const card1 = dealtCards[index1] as DealtCard;
      const label1 = card1.rankLabel;
      for (let index2 = index1 + 1; index2 < dealtCards.length; index2 += 1) {
        const card2 = dealtCards[index2] as DealtCard;
        const label2 = card2.rankLabel;
        const discard12 = label1 + label2;
        const discard21 = label2 + label1;
        if (!seenDiscards.has(discard12) && !seenDiscards.has(discard21)) {
          seenDiscards.add(discard12);
          seenDiscards.add(discard21);
          keepDiscards.push({
            discard: [card1, card2],
            keep: dealtCards.filter(
              (_, index) => index !== index1 && index !== index2
            ),
          });
        }
      }
    }
    return keepDiscards;
  }

  override render() {
    return (
      <div className="calculations">
        {this.getAllKeepDiscardCombinations()
          .map((keepDiscard) => ({
            discard: keepDiscard.discard,
            keep: keepDiscard.keep,
            points: Calculations.countPoints(keepDiscard.keep),
          }))
          .sort((card1, card2) => card2.points - card1.points)
          .map((scoredKeepDiscard) => (
            <Calculation
              key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard]
                .map((dealtCard) => dealtCard.rankLabel)
                .join("")}
              scoredKeepDiscard={scoredKeepDiscard}
            />
          ))}
      </div>
    );
  }
}

const CARD_LABELS = "A23456789TJQK";
const MAXIMUM_CARD_COUNTING_VALUE = 10;
const CARDS_PER_DEALT_HAND = 6;
const INDICES_PER_SUIT = 13;
const CARDS_PER_DISCARD = 2;

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
      dealtCards: Array.from({ length: CARDS_PER_DEALT_HAND }, () =>
        Math.floor(Math.random() * INDICES_PER_SUIT)
      )
        .map((rankValue, index) => ({
          count: Math.min(rankValue + 1, MAXIMUM_CARD_COUNTING_VALUE),
          index,
          kept: true,
          rankLabel: CARD_LABELS[rankValue] as string,
          rankValue,
        }))
        .sort(this.descendingCompareFn),
      showCalculations: false,
      sortOrder: Sort.Descending,
    };
  }

  toggleKept = (index: number) => {
    const { dealtCards } = this.state;
    if (!Number.isInteger(index) || index < 0 || index >= dealtCards.length) {
      throw Error(`Invalid dealtCards ${dealtCards} index ${index}.`);
    }

    this.setState((state) => {
      const toggleCard = state.dealtCards[index] as DealtCard;
      toggleCard.kept = !toggleCard.kept;
      return {
        dealtCards: state.dealtCards,
        showCalculations:
          state.dealtCards.filter((dealtCard) => !dealtCard.kept).length ===
          CARDS_PER_DISCARD,
      };
    });
  };

  descendingCompareFn = (first: DealtCard, second: DealtCard) =>
    second.rankValue - first.rankValue;

  setSortOrder = (sortOrder: SortName) => {
    this.setState((state) => {
      switch (Sort[sortOrder]) {
        case Sort.Ascending:
          state.dealtCards.sort(
            (first, second) => first.rankValue - second.rankValue
          );
          break;
        case Sort.Descending:
          state.dealtCards.sort(this.descendingCompareFn);
          break;
        default:
          state.dealtCards.sort((first, second) => first.index - second.index);
          break;
      }
      return {
        dealtCards: state.dealtCards,
        sortOrder: Sort[sortOrder],
      };
    });
  };

  override render() {
    const { sortOrder, dealtCards, showCalculations } = this.state;
    return (
      <React.StrictMode>
        <div>
          <SortOrder
            setSortOrder={this.setSortOrder}
            sortOrder={sortOrder}
          />
          <Hand
            dealtCards={dealtCards}
            toggleKept={this.toggleKept}
          />
          {!showCalculations || <Calculations dealtCards={dealtCards} />}
        </div>
      </React.StrictMode>
    );
  }
}

// TODO: add a test which would fail if I hand <React.StrictMode><Trainer /></React.StrictMode> to render()
ReactDOMClient.createRoot(
  document.querySelector("#trainer") ?? document.documentElement
).render(<Trainer />);
