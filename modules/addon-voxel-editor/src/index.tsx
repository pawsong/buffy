import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Container from './components/Container';
import store from './store';

// OrbitControls patch
import './OrbitControls';

// TODO: submit can be performed by ajax call
export default function init(container, submit) {

  ReactDOM.render(
    <Provider store={store}>
      <Container submit={submit}/>
    </Provider>,
    container
  );
}
