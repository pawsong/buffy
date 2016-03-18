import { createStore, applyMiddleware, Middleware, compose } from 'redux';
import { routerMiddleware, push } from 'react-router-redux';
import createSagaMiddleware from 'redux-saga';
const objectAssign = require('object-assign');
import rootReducer, { initialize } from '../reducers';
import apiSaga from '../api/saga';

export default function configureStore(initialState?: any, history?) {
  const middlewares: Middleware[] = [];

  // react-router-redux middleware
  if (history) {
    middlewares.push(routerMiddleware(history));
  }

  // redux-saga middleware
  const sagaMiddleware = createSagaMiddleware(apiSaga);
  middlewares.push(sagaMiddleware);

  const finalInitialState = {};
  if (initialState) {
    Object.keys(initialState).forEach(prop => {
      const init = initialize[prop];
      finalInitialState[prop] = init ? init(initialState[prop]) : initialState[prop];
    });
  }

  const store = createStore(
    rootReducer,
    finalInitialState,
    compose(
      applyMiddleware(...middlewares),
      __DEV__ && typeof window === 'object' && typeof window['devToolsExtension'] !== 'undefined' ? window['devToolsExtension']() : f => f
    ) as any
  );

  if (__DEV__ && module.hot) {
    // Enable Webpack hot module replacement for reducers
    module.hot.accept('../reducers', () => {
      const nextRootReducer = require('../reducers').default
      store.replaceReducer(nextRootReducer)
    });
  }

  return {
    store,
    sagaMiddleware,
  };
}
