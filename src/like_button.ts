'use strict';

console.log('Hello, Console!');

import { createElement, Component } from 'react';
import { createRoot } from 'react-dom/client';

type LikeButtonProps = {};

class LikeButton extends Component<LikeButtonProps, { liked: boolean }> {
  constructor(props: LikeButtonProps) {
    super(props);
    this.state = { liked: false };
  }

  render() {
    if (this.state.liked) {
      return 'You liked this.';
    }

    return createElement(
      'button',
      { onClick: () => this.setState({ liked: true }) },
      'Like'
    );
  }
}

const domContainer = document.querySelector('#like_button_container');
const root = createRoot(domContainer!);
root.render(createElement(LikeButton));
