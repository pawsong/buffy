require('react-tap-event-plugin')();
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import { EventEmitter } from 'fbemitter';

import { InstallAddon } from '@pasta/core/lib/Addon';
import StateLayerProvider from '@pasta/components/lib/stateLayer/Provider';

import Container from './components/Container';
import store from './store';

// OrbitControls patch
import './OrbitControls';

const install: InstallAddon = (container, stateLayer) => {
  const emitter = new EventEmitter();

  ReactDOM.render(
    <StateLayerProvider stateLayer={stateLayer}>
      <Provider store={store}>
        <Container addonEmitter={emitter}/>
      </Provider>
    </StateLayerProvider>,
    container
  );

  return {
    emit(event, data) {
      emitter.emit(event, data);
    },
    destroy() {
      emitter.removeAllListeners();
      ReactDOM.unmountComponentAtNode(container);
    },
  };
};

export default install;
