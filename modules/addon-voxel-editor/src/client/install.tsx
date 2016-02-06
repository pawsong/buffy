require('react-tap-event-plugin')();
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { InstallAddon } from '@pasta/core/lib/Addon';
import StateLayerProvider from '@pasta/components/lib/stateLayer/Provider';

import Container from './components/Container';
import store from './store';

// OrbitControls patch
import './OrbitControls';

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
