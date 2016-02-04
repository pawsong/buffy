import * as React from 'react'
import { Router, Route, Link, IndexRoute } from 'react-router'
import * as axios from 'axios';

import Root from './components/Root';
import Login from './components/Login';
import Master from './components/Master';

import {
  AUTH_LOGIN_SUCCEED,
  AUTH_LOGIN_FAIL,
} from './constants/ActionTypes';

export default store => {
  async function tryLogin(): Promise<boolean> {
    const { triedToLogin, user } = store.getState().auth;
    if (triedToLogin) { return !!user; }

    try {
      const res = await axios.get(`${CONFIG_AUTH_SERVER_URL}/me`, {
         withCredentials: true,
      });
      store.dispatch({ type: AUTH_LOGIN_SUCCEED, user: res.data });
    } catch(err) {
      if (err.status !== 401) { throw err; }
      store.dispatch({ type: AUTH_LOGIN_FAIL });
      return false;
    }
    return true;
  }

  return {
    component: Root,
    childRoutes: [{
      path: '/login',
      onEnter: (next, replace, cb) => {
        tryLogin().then(result => result && replace({
          pathname: next.location.query.n || '/',
        })).then(() => cb()).catch(cb);
      },
      component: Login,
    }, {
      path: '/',
      onEnter: (next, replace, cb) => {
        tryLogin().then(result => result || replace({
          pathname: '/login',
          query: { n: next.pathname },
        })).then(() => cb()).catch(cb);
      },
      component: Master,
      childRoutes: []
    }]
  };
}
