import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import Container from './components/Container';

import THREE from 'three';
import EventEmitter from 'eventemitter3';

import { createEffectManager } from './effects';

import store from './store';

const Promise = require('bluebird');

const PIXEL_NUM = 16;
const PIXEL_UNIT = 32;
const BOX_SIZE = PIXEL_UNIT * 2;
const MINI_PIXEL_SIZE = BOX_SIZE / PIXEL_NUM;
const GRID_SIZE = BOX_SIZE * 10;

export function initGameView(container, gameStore, api) {
  ReactDOM.render(
    <Provider store={store}>
      <Container gameStore={gameStore} api={api}/>
    </Provider>,
    container
  );
}

