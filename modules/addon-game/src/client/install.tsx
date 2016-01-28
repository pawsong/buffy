require('react-tap-event-plugin')();
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Container from './components/Container';
import store from './store';
import { InstallAddon } from '@pasta/addon/lib/Addon';

const install: InstallAddon = (container, stateLayer) => {
  ReactDOM.render(
    <Provider store={store}>
      <Container stateLayer={stateLayer}/>
    </Provider>,
    container
  );
  return () => ReactDOM.unmountComponentAtNode(container);
};

export default install;
