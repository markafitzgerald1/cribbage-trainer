import React from 'react';
import ReactDOMClient from 'react-dom/client';

function Card(props: { rank: string }) {
    return <li className="card">{props.rank}</li>
}

class Hand extends React.Component<{}, { ranks: string[] }> {
    constructor(props: {}) {
        super(props);
        this.state = { ranks: Array.from({ length: 6 }, () => "A23456789TJQK"[Math.floor(Math.random() * 13)]) };
    }

    render() {
        return <ul className="hand">
            {this.state.ranks.map((rank, index) => <Card rank={rank} key={index} />)}
        </ul>;
    }
}

ReactDOMClient.createRoot(document.querySelector('#hand')!).render(<Hand />);
