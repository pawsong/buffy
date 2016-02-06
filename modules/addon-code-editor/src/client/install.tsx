require('react-tap-event-plugin')();
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { InstallAddon } from '@pasta/core/lib/Addon';
import StateLayerProvider from '@pasta/components/lib/stateLayer/Provider';

import App from './components/App';

const install: InstallAddon = (container, stateLayer) => {
  ReactDOM.render(
    <StateLayerProvider stateLayer={stateLayer}>
      <App/>
    </StateLayerProvider>,
    container
  );
  return () => ReactDOM.unmountComponentAtNode(container);
};

export default install;
