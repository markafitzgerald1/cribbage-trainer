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
        return <li className={`card ${this.props.dealtCard.kept ? "" : "discarded"}`} onClick={this.props.toggleKept}>{this.props.dealtCard.rank}</li>;
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
            {/* TODO: add UI cards sort control with descending by rank, ascending by rank and deal order (default) as options */}
            {/* TODO: then auto-calculate as user clicks: pre-cut hand value, post-cut hand value, pre-cut and opponent discard crib value, pre-cut crib value, pre-opponent discard crib value, post-cut and opponent discard crib value, sum of both */}
            {/* TODO: then auto-analyze as user clicks: expected hand, crib values for each possible discard */}
            {this.props.dealtCards.map((dealtCard) => <Card dealtCard={dealtCard} toggleKept={() => this.props.toggleKept(dealtCard.index)} key={dealtCard.index} />)}
        </ul>;
    }
}

type DealtCard = {
    rank: string,
    kept: boolean,
    index: number
}

class Trainer extends React.Component<{}, { dealtCards: DealtCard[] }> {
    constructor(props: {}) {
        super(props);
        this.state = {
            dealtCards: Array.from({ length: 6 }, () => "A23456789TJQK"[Math.floor(Math.random() * 13)]).map((rank, index) => ({ rank: rank, kept: true, index: index }))
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

    render() {
        return <div>
            <Hand dealtCards={this.state.dealtCards} toggleKept={this.toggleKept}/>
        </div>
    }
}

ReactDOMClient.createRoot(document.querySelector('#trainer')!).render(<Trainer />);
