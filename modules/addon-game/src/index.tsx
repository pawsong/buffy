import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Container from './components/Container';
import store from './store';
import Addon from '@pasta/addon/lib/Addon';

const addon: Addon = function (container, stateLayer) {
  ReactDOM.render(
    <Provider store={store}>
      <Container stateLayer={stateLayer}/>
    </Provider>,
    container
  );

  return {
    destroy() {
      return ReactDOM.unmountComponentAtNode(container);
    },
  };
}

export default addon;
