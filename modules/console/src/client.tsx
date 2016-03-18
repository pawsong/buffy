import 'babel-polyfill';
import * as Promise from 'bluebird';
Promise.config({ warnings: false });

require('react-tap-event-plugin')();
import './vendor';

import * as Immutable from 'immutable';

import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { browserHistory } from 'react-router';
import { match } from 'react-router'
const { Router, RouterContext }  = require('react-router');
const { ReduxAsyncConnect, loadOnServer } = require('redux-async-connect');
const MuiThemeProvider = require('material-ui/lib/MuiThemeProvider');
const getMuiTheme = require('material-ui/lib/styles/getMuiTheme');
const { StyleRoot } = require('radium');
const Hairdresser = require('hairdresser');
import { IntlProvider } from 'react-intl';

import { Provider as HairdresserProvider } from './hairdresser';
import { Provider as SagaProvider } from './saga';

import { baseTheme, muiTheme } from './theme';

import getRoutes from './routes';
import configureStore from './store';

import { EXPIRE_PRELOAD } from './api';

const initialState = window['__INTIAL_STATE__'];
delete window['__INTIAL_STATE__'];

// const history = useScroll(() => browserHistory)();
const history = browserHistory;

const { store, sagaMiddleware } = configureStore(initialState, history);
const routes = getRoutes(store);

const finalMuiTheme = getMuiTheme(baseTheme, muiTheme);
const hairdresser = new Hairdresser();
hairdresser.render();

match({ history, routes }, (error, redirectLocation, renderProps) => {
  render(
    <IntlProvider locale="en">
      <HairdresserProvider hairdresser={hairdresser}>
        <MuiThemeProvider muiTheme={finalMuiTheme}>
          <Provider store={store}>
            <SagaProvider middleware={sagaMiddleware}>
              <Router history={history}
                      render={props => <StyleRoot><RouterContext {...props} /></StyleRoot>}
              >{routes}</Router>
            </SagaProvider>
          </Provider>
        </MuiThemeProvider>
      </HairdresserProvider>
    </IntlProvider>,
    document.getElementById('content')
  );
  store.dispatch({ type: EXPIRE_PRELOAD });
});
