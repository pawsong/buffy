import { createStore, applyMiddleware, Middleware, compose } from 'redux';
import { routerMiddleware, push } from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
const objectAssign = require('object-assign');
import { browserHistory } from 'react-router';
import { syncHistoryWithStore, routerReducer } from 'react-router-redux';
const useScroll = require('scroll-behavior/lib/useStandardScroll');

import rootReducer, { initialize } from '../reducers';
import apiSaga from '../api/saga';

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
  const sagaMiddleware = createSagaMiddleware(apiSaga);
  middlewares.push(sagaMiddleware);

  const store = createStore(
    rootReducer,
    finalInitialState,
    compose(
      applyMiddleware(...middlewares)
    ) as any
  );

  let history = null;
  if (__CLIENT__) {
    const scrollHistory = useScroll(() => browserHistory)();
    history = syncHistoryWithStore(scrollHistory, store);
  }

  if (__DEV__ && module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers').default
      store.replaceReducer(nextRootReducer)
    });
  }

  return { store, history, sagaMiddleware };
}
