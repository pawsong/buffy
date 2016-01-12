import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Container from './components/Container';
import store from './store';

export function initGameView(container, gameStore, api) {
  ReactDOM.render(
    <Provider store={store}>
      <Container gameStore={gameStore} api={api}/>
    </Provider>,
    container
  );
}

