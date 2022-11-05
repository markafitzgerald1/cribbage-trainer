// TODO: add formatter, linter (static code analysis tool) to project, build pipeline and GitHub Actions Workflow.
import React from 'react';
import ReactDOMClient from 'react-dom/client';

type DealtCard = {
    rankLabel: string,
    rankValue: number,
    count: number,
    kept: boolean,
    index: number
}

type CardProps = {
    dealtCard: DealtCard,
    toggleKept: () => void
};

class Card extends React.Component<CardProps, {}> {
    constructor(props: CardProps) {
        super(props);
    }

    render() {
        return <li className={`card${this.props.dealtCard.kept ? "" : " discarded"}`} onClick={this.props.toggleKept}>{this.props.dealtCard.rankLabel}</li>;
    }
}

type HandProps = {
    dealtCards: DealtCard[],
    toggleKept: (index: number) => void
};

class Hand extends React.Component<HandProps, {}> {
    constructor(props: HandProps) {
        super(props);
    }

    render() {
        return <ul className="hand">
            {/* TODO: auto-calculate as user clicks: post-cut hand value, pre-cut and opponent discard crib value, pre-cut crib value, pre-opponent discard crib value, post-cut and opponent discard crib value, sum of both */}
            {/* TODO: auto-analyze as user clicks: expected hand, crib values for each possible discard */}
            {this.props.dealtCards.map((dealtCard, index) => <Card dealtCard={dealtCard} toggleKept={() => this.props.toggleKept(index)} key={dealtCard.index} />)}
        </ul>;
    }
}

enum SortOrdering {
    DealOrder,
    Descending,
    Ascending
}

const SortLabel = {
    DealOrder: "↔️",
    Descending: "↘️",
    Ascending: "↗️"
};

const SortDescription = {
    DealOrder: "deal order",
    Descending: "descending",
    Ascending: "ascending"
};

class SortOrder extends React.Component<{ sortOrder: SortOrdering, setSortOrder: (sortOrder: string) => void }> {
    onChange = (e: React.FormEvent<HTMLInputElement>) => {
        this.props.setSortOrder(e.currentTarget.value);
    }

    render() {
        return <div className="sortorder">
            <span>Sort: </span>
            {Object.keys(SortOrdering).filter(key => !isNaN(Number(SortOrdering[key]))).map((key) => <span key={SortOrdering[key]}>
                <input type="radio" id={key} name="sort" value={SortOrdering[SortOrdering[key]]} checked={this.props.sortOrder === SortOrdering[key]} onChange={this.onChange} />
                <label htmlFor={key}>{SortLabel[key]}</label>
            </span>)}
            <span className="sort-order-description"> ({SortDescription[SortOrdering[this.props.sortOrder]]})</span>
        </div>;
    }
}

type KeepDiscard = {
    keep: DealtCard[],
    discard: DealtCard[]
}

function handToString(dealtCards: DealtCard[]) {
    return dealtCards.map((dealtCard) => dealtCard.rankLabel).join('');
}

type ScoredKeepDiscard = KeepDiscard & { points: number };

class Calculation extends React.Component<{ scoredKeepDiscard: ScoredKeepDiscard }> {
    render() {
        return <div><span className="keep-discard">{handToString(this.props.scoredKeepDiscard.keep)}</span>-<span className="keep-discard">{handToString(this.props.scoredKeepDiscard.discard)}</span> for {this.props.scoredKeepDiscard.points} points</div>;
    }
}

const POINTS = {
    PAIR: 2,
    FIFTEENS: 2,
    THREE_CARD_RUN: 3,
    FOUR_CARD_RUN: 4
} as const;

const COUNT = {
    FIFTEEN: 15
} as const;

class Calculations extends React.Component<{ dealtCards: DealtCard[] }> {
    render() {
        return <div className="calculations">
            {this.getAllKeepDiscardCombinations().map((keepDiscard) => ({ keep: keepDiscard.keep, discard: keepDiscard.discard, points: this.countPoints(keepDiscard.keep) })).sort((a, b) => b.points - a.points).map((scoredKeepDiscard) => <Calculation scoredKeepDiscard={scoredKeepDiscard} key={[...scoredKeepDiscard.keep, ...scoredKeepDiscard.discard].map((dealtCard) => dealtCard.rankLabel).join('')} />)}
        </div>
    }

    countPoints(keep: DealtCard[]) {
        // TODO: unit test me
        let ans = 0;
        const keepCopy = [...keep].sort((a, b) => a.rankValue - b.rankValue);

        let threeRuns = 0, fourRuns = 0;
        for (let i=0; i<keepCopy.length; i++) {
            for (let j=i+1; j<keepCopy.length; j++) {
                if (keepCopy[i].rankValue === keepCopy[j].rankValue) {
                    ans += POINTS.PAIR;
                }
                if (keepCopy[i].count + keepCopy[j].count == 15) {
                    ans += POINTS.FIFTEENS;
                }
                for (let k=j+1; k<keepCopy.length; k++) {
                    if (keepCopy[i].count + keepCopy[j].count + keepCopy[k].count == COUNT.FIFTEEN) {
                        ans += POINTS.FIFTEENS;
                    }
                    if (
                        keepCopy[i].rankValue + 1 === keepCopy[j].rankValue &&
                        keepCopy[j].rankValue + 1 === keepCopy[k].rankValue
                    ) {
                        threeRuns++;
                    }
                    for (let l=k+1; l<keepCopy.length; l++) {
                        if (keepCopy[i].count + keepCopy[j].count + keepCopy[k].count + keepCopy[l].count == COUNT.FIFTEEN) {
                            ans += POINTS.FIFTEENS;
                        }
                        if (
                            keepCopy[i].rankValue + 1 === keepCopy[j].rankValue &&
                            keepCopy[j].rankValue + 1 === keepCopy[k].rankValue &&
                            keepCopy[k].rankValue + 1 === keepCopy[l].rankValue
                        ) {
                            fourRuns++;
                        }
                    }
                }
            }
        }

        if (fourRuns) {
            ans += fourRuns * POINTS.FOUR_CARD_RUN;
        }
        else if (threeRuns) {
            ans += threeRuns * POINTS.THREE_CARD_RUN;
        }

        return ans;
    }

    getAllKeepDiscardCombinations() {
        // TODO: unit test this!
        const keepDiscards: KeepDiscard[] = [];
        const seenDiscards: Set<string> = new Set();
        for (let i=0; i<this.props.dealtCards.length; i++) {
            for (let j=i+1; j<this.props.dealtCards.length; j++) {
                const discard = this.props.dealtCards.filter((_, index) => index === i || index === j);
                const discardStr1 = discard[0].rankLabel + discard[1].rankLabel;
                const discardStr2 = discard[1].rankLabel + discard[0].rankLabel;
                if (!seenDiscards.has(discardStr1) && !seenDiscards.has(discardStr2)) {
                    seenDiscards.add(discardStr1);
                    seenDiscards.add(discardStr2);
                    keepDiscards.push({
                        keep: this.props.dealtCards.filter((_, index) => index !== i && index !== j),
                        discard
                    });
                }
            }
        }
        return keepDiscards;
    }
}

const CARD_LABELS = "A23456789TJQK";
const MAXIMUM_CARD_COUNTING_VALUE = 10;

class Trainer extends React.Component<{}, { dealtCards: DealtCard[], sortOrder: SortOrdering, showCalculations: boolean }> {
    constructor(props: {}) {
        super(props);
        this.state = {
            dealtCards: Array.from({ length: 6 }, () => Math.floor(Math.random() * 13)).map((rankValue, index) => ({ rankLabel: CARD_LABELS[rankValue], rankValue, count: Math.min(rankValue + 1, MAXIMUM_CARD_COUNTING_VALUE), kept: true, index })).sort(this.descendingCompareFn),
            sortOrder: SortOrdering.Descending,
            showCalculations: false
        };
    }

    toggleKept = (index: number) => {
        this.setState((state) => {
            state.dealtCards[index].kept = !state.dealtCards[index].kept;
            return {
                dealtCards: state.dealtCards,
                showCalculations: state.dealtCards.filter((dealtCard) => !dealtCard.kept).length == 2
            };
        });
    }

    descendingCompareFn = ((a: DealtCard, b: DealtCard) => b.rankValue - a.rankValue);

    setSortOrder = (sortOrder: string) => {
        this.setState((state) => {
            const newSortOrder: SortOrdering = SortOrdering[sortOrder];
            switch(newSortOrder) {
                case SortOrdering.Ascending:
                    state.dealtCards.sort((a, b) => a.rankValue - b.rankValue);
                    break;
                case SortOrdering.Descending:
                    state.dealtCards.sort(this.descendingCompareFn);
                    break;
                default:
                    state.dealtCards.sort((a, b) => a.index - b.index);
                    break;
            }
            return {
                sortOrder: SortOrdering[sortOrder],
                dealtCards: state.dealtCards
            };
        });
    }

    render() {
        return <div>
            <SortOrder sortOrder={this.state.sortOrder} setSortOrder={this.setSortOrder} />
            <Hand dealtCards={this.state.dealtCards} toggleKept={this.toggleKept}/>
            {!this.state.showCalculations || <Calculations dealtCards={this.state.dealtCards}/>}
        </div>;
    }
}

ReactDOMClient.createRoot(document.querySelector('#trainer')!).render(<Trainer />);
