import 'whatwg-fetch';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Container from './components/Container';
import initVoxelView from './views/voxel';
import initSpriteView from './views/sprite';
import initControlView from './views/control';
import store from './store';

// TODO: submit can be performed by ajax call
export default function init(container, submit) {
  // OrbitControls patch
  require('./OrbitControls');

  ReactDOM.render(
    <Provider store={store}>
      <Container submit={submit} element={container}/>
    </Provider>,
    container
  );
}
