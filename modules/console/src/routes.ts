import * as React from 'react'
import { Router, Route, Link, IndexRoute } from 'react-router'

import App from './components/App';
import Login from './components/Login';
import Master from './components/Master';

function redirect(handler, test, path, query) {
  return function(nextState, replaceState) {
    if (handler() !== test) { return; }
    replaceState(null, path, query ? query(nextState) : null);
  }
}

export default store => {
  function isAuthenticated() {
    const { user } = store.getState();
    return !!user;
  }

  const redirectToLogin = redirect(isAuthenticated, false, '/login', nextState => ({
    n: nextState.location.pathname,
  }));

  return {
    component: App,
    childRoutes: [{
      path: '/login',
      onEnter: redirect(isAuthenticated, true, '/', undefined),
      component: Login,
    }, {
      path: '/',
      onEnter: redirectToLogin,
      component: Master,
      childRoutes: []
    }]
  };
}
