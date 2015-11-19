import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import store from '../../store';

import Controls from '../../components/Controls';

export default (container, submit) => {
  const uiElement = document.createElement('div');
  container.appendChild(uiElement);
  uiElement.style.width = '100%';

  ReactDOM.render(
    <Provider store={store}>
      <Controls submit={submit}/>
    </Provider>,
    uiElement
  );
}
