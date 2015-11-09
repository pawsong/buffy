import 'babel-polyfill';

//Needed for onTouchTap
//Can go away when react 1.0 release
//Check this repo:
//https://github.com/zilverline/react-tap-event-plugin
require('react-tap-event-plugin')();

import './patch/superagent';

import React from 'react'
import { render } from 'react-dom'
import { createHistory, useQueries } from 'history';
import { Router } from 'react-router'
import { Provider } from 'react-redux';
import routes from './routes';
import Hairdresser from 'hairdresser';
import { provideHairdresserContext } from './hairdresser';
import { createStore } from 'redux';
import rootReducer from './reducers';

const HairdresserProvider = provideHairdresserContext(Provider);

// Grab the state from a global injected into server-generated HTML
const initialState = window.__INITIAL_STATE__;
delete window.__INITIAL_STATE__;

const history = useQueries(createHistory)();

const store = createStore(rootReducer, initialState);
const hairdresser = Hairdresser.create();
hairdresser.render();

render(
  <HairdresserProvider store={store} hairdresser={hairdresser}>
    <Router history={history} routes={routes(store)}/>
  </HairdresserProvider>,
  document.getElementById('content')
)
