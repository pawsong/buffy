import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import store from '../../store';

import Controls from '../../components/Controls';

export default (container, submit) => {
  const uiElement = document.createElement('div');
  container.appendChild(uiElement);
  uiElement.style.position = 'absolute';
  uiElement.style.width = '100%';

  const rootEl = container.parentElement.parentElement;

  ReactDOM.render(
    <Provider store={store}>
      <Controls submit={submit} rootElement={rootEl}/>
    </Provider>,
    //container
    uiElement
  );
}
