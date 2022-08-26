'use strict';

console.log('Hello, Console!');

import React from 'react';
import ReactDOMClient from 'react-dom/client';

type LikeButtonProps = {};

class LikeButton extends React.Component<LikeButtonProps, { liked: boolean }> {
  constructor(props: LikeButtonProps) {
    super(props);
    this.state = { liked: false };
  }

  render() {
    if (this.state.liked) {
      return 'You liked this.';
    }

    return (
      <button onClick={() => this.setState({ liked: true })}>
        Like
      </button>
    );
  }
}

const domContainer = document.querySelector('#like_button_container');
const root = ReactDOMClient.createRoot(domContainer!);
root.render(React.createElement(LikeButton));
