require('react-tap-event-plugin')();
import { InstallAddon } from '@pasta/core/lib/Addon';
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import App from './components/App';

const install: InstallAddon = (container, stateLayer) => {
  ReactDOM.render(
    <App stateLayer={stateLayer}/>,
    container
  );
  return () => ReactDOM.unmountComponentAtNode(container);
};

export default install;
