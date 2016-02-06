require('react-tap-event-plugin')();
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Container from './components/Container';
import store from './store';
import { InstallAddon } from '@pasta/core/lib/Addon';
import StateLayerProvider from '@pasta/components/lib/stateLayer/Provider';

const install: InstallAddon = (container, stateLayer) => {
  ReactDOM.render(
    <StateLayerProvider stateLayer={stateLayer}>
      <Provider store={store}>
        <Container/>
      </Provider>
    </StateLayerProvider>,
    container
  );
  return () => ReactDOM.unmountComponentAtNode(container);
};

export default install;
