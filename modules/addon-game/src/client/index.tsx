import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Container from './components/Container';
import store from './store';
import * as addon from '@pasta/addon';

addon.register({
  name: NPM_PACKAGE_NAME,
  install: function (container, stateLayer) {
    ReactDOM.render(
      <Provider store={store}>
        <Container stateLayer={stateLayer}/>
      </Provider>,
      container
    );

    return () => ReactDOM.unmountComponentAtNode(container);
  }
});
