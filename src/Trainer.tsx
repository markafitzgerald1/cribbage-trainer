import React from 'react';
import ReactDOMClient from 'react-dom/client';

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
            {/* TODO: auto-calculate as user clicks: pre-cut hand value, post-cut hand value, pre-cut and opponent discard crib value, pre-cut crib value, pre-opponent discard crib value, post-cut and opponent discard crib value, sum of both */}
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
            {Object.keys(SortOrdering).filter(key => !isNaN(Number(SortOrdering[key]))).map((key) => <span>
                <input type="radio" id={key} name="sort" value={SortOrdering[SortOrdering[key]]} checked={this.props.sortOrder === SortOrdering[key]} onChange={this.onChange} />
                <label htmlFor={key}>{SortLabel[key]}</label>
            </span>)}
            <span className="sort-order-description"> ({SortDescription[SortOrdering[this.props.sortOrder]]})</span>
        </div>;
    }
}

type DealtCard = {
    rankLabel: string,
    rankValue: number,
    kept: boolean,
    index: number
}

class Trainer extends React.Component<{}, { dealtCards: DealtCard[], sortOrder: SortOrdering }> {
    constructor(props: {}) {
        super(props);
        this.state = {
            dealtCards: Array.from({ length: 6 }, () => Math.floor(Math.random() * 13)).map((rankValue, index) => ({ rankLabel: "A23456789TJQK"[rankValue], rankValue, kept: true, index })),
            sortOrder: SortOrdering.DealOrder
        };
    }

    toggleKept = (index: number) => {
        this.setState((state) => {
            state.dealtCards[index].kept = !state.dealtCards[index].kept;
            return {
                dealtCards: state.dealtCards
            };
        });
    }

    setSortOrder = (sortOrder: string) => {
        this.setState((state) => {
            const newSortOrder: SortOrdering = SortOrdering[sortOrder];
            switch(newSortOrder) {
                case SortOrdering.Ascending:
                    state.dealtCards.sort((a, b) => a.rankValue - b.rankValue);
                    break;
                case SortOrdering.Descending:
                    state.dealtCards.sort((a, b) => b.rankValue - a.rankValue);
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
        </div>;
    }
}

ReactDOMClient.createRoot(document.querySelector('#trainer')!).render(<Trainer />);
