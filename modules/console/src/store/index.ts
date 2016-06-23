import { createStore, applyMiddleware, Middleware, compose } from 'redux';
import { routerMiddleware, push } from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
import { browserHistory } from 'react-router';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
import ReactGA from 'react-ga';

import rootReducer, { initialize } from '../reducers';
import apiSaga from '../api/saga';

import { LOADING_DONE } from '../actions/loading';

export default function configureStore(initialState?: any) {
  const finalInitialState = {};
  if (initialState) {
    Object.keys(initialState).forEach(prop => {
      const init = initialize[prop];
      finalInitialState[prop] = init ? init(initialState[prop]) : initialState[prop];
    });
  }

  const middlewares: Middleware[] = [];

  if (__CLIENT__) {
    middlewares.push(routerMiddleware(browserHistory));
  }

  // redux-saga middleware
  const sagaMiddleware = createSagaMiddleware();
  middlewares.push(sagaMiddleware);

  const store = createStore(
    rootReducer,
    finalInitialState,
    compose(
      applyMiddleware(...middlewares)
    ) as any
  );

  sagaMiddleware.run(apiSaga);


  let history = null;
  let onRouterUpdate = null;
  if (__CLIENT__) {
    ReactGA.initialize(__GA_TRACKING_ID__);
    history = syncHistoryWithStore(browserHistory, store);
    onRouterUpdate = function () {
      store.dispatch({ type: LOADING_DONE });
      ReactGA.pageview(window.location.pathname);
    };
  }

  if (__DEV__ && module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers').default
      store.replaceReducer(nextRootReducer)
    });
  }

  return { store, history, sagaMiddleware, onRouterUpdate };
}
