require('react-tap-event-plugin')();
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { EventEmitter } from 'fbemitter';

import { InstallAddon } from '@pasta/core/lib/Addon';
import StateLayerProvider from '@pasta/components/lib/stateLayer/Provider';

import './blockly/blocks';

import App from './components/App';

const install: InstallAddon = (container, stateLayer) => {
  const emitter = new EventEmitter();

  ReactDOM.render(
    <StateLayerProvider stateLayer={stateLayer}>
      <App addonEmitter={emitter}/>
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
  }
};

export default install;
