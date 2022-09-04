import React from 'react';
import ReactDOMClient from 'react-dom/client';

type CardProps = {
    rank: string,
    toggleKept: () => void
};

class Card extends React.Component<CardProps, {}> {
    constructor(props: CardProps) {
        super(props);
    }

    render() {
        return <li className="card" onClick={this.props.toggleKept}>{this.props.rank}</li>;
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
        return <div>
            <div>
                <span>Hand: </span>
                <ul className="hand">
                    {this.props.dealtCards.filter((dealtCard) => dealtCard.kept).map((dealtCard) => <Card rank={dealtCard.rank} toggleKept={() => this.props.toggleKept(dealtCard.index)} key={dealtCard.index} />)}
                </ul>
            </div>
            <div>
                <span>Crib: </span>
                <ul className="hand">
                    {this.props.dealtCards.filter((dealtCard) => !dealtCard.kept).map((dealtCard) => <Card rank={dealtCard.rank} toggleKept={() => this.props.toggleKept(dealtCard.index)} key={dealtCard.index} />)}
                </ul>
            </div>
        </div>;
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
        this.setState((state, props) => {
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
