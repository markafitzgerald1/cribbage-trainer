import React from 'react';
import ReactDOMClient from 'react-dom/client';

class Card extends React.Component<{}, { rank: string }> {
    constructor(props: {}) {
        super(props);
        this.state = { rank: "A23456789TJQK"[Math.floor(Math.random() * 13)] };
    }

    render() {
        return <span className="card">{this.state.rank}</span>;
    }
}

ReactDOMClient.createRoot(document.querySelector('#card')!).render(<Card />);
