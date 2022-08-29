import React from 'react';
import ReactDOMClient from 'react-dom/client';

function Card(props: { rank: string }) {
    return <span className="card">{props.rank}</span>;
}

ReactDOMClient.createRoot(document.querySelector('#card')!).render(<Card rank="Q" />);
