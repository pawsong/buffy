import 'babel-polyfill';

require('react-tap-event-plugin')();

import * as React from 'react'
import { render } from 'react-dom'
import { Router } from 'react-router'
import { Provider } from 'react-redux';
import routes from './routes';
import { createStore } from 'redux';
import rootReducer from './reducers';
import { browserHistory } from 'react-router';

const store = createStore(rootReducer);

render(
  <Provider store={store}>
    <Router history={browserHistory} routes={routes(store)}/>
  </Provider>,
  document.getElementById('content')
);
