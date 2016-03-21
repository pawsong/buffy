import 'babel-polyfill';
import * as Promise from 'bluebird';
Promise.config({ warnings: false });

require('react-tap-event-plugin')();
import './vendor';

import * as Immutable from 'immutable';

import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { match } from 'react-router'
const { Router, RouterContext }  = require('react-router');
const { ReduxAsyncConnect, loadOnServer } = require('redux-async-connect');
const MuiThemeProvider = require('material-ui/lib/MuiThemeProvider');
const getMuiTheme = require('material-ui/lib/styles/getMuiTheme');
const { StyleRoot } = require('radium');
const Hairdresser = require('hairdresser');
import { IntlProvider, addLocaleData } from 'react-intl';

import { Provider as HairdresserProvider } from './hairdresser';
import { Provider as SagaProvider } from './saga';

import { baseTheme, muiTheme } from './theme';

import getRoutes from './routes';
import configureStore from './store';

import { EXPIRE_PRELOAD } from './api';

const initialState = window['__INTIAL_STATE__'];
delete window['__INTIAL_STATE__'];

const locale = window['__LOCALE__'];
delete window['__LOCALE__'];

const { store, history, sagaMiddleware } = configureStore(initialState);
const routes = getRoutes(store);

const finalMuiTheme = getMuiTheme(baseTheme, muiTheme);
const hairdresser = new Hairdresser();
hairdresser.render();

interface LocaleData {
  data: any;
  messages: any;
}

function ensureIntl(locale: string) {
  return new Promise((resolve => {
    if (window['Intl']) return resolve();

    switch(locale) {
      case 'ko': {
        return require.ensure([
          'intl',
          'intl/locale-data/jsonp/ko.js'
        ], require => {
          require('intl');
          require('intl/locale-data/jsonp/ko.js');
          resolve();
        });
      }
      default: {
        return require.ensure([
          'intl',
          'intl/locale-data/jsonp/en.js'
        ], require => {
          require('intl');
          require('intl/locale-data/jsonp/en.js');
          resolve();
        });
      }
    }
  }));
}

function loadLocaleData(locale: string) {
  return ensureIntl(locale).then(() => new Promise<LocaleData>(resolve => {
    switch(locale) {
      case 'ko': {
        return require.ensure([], require => resolve({
          messages: require('./messages/ko')['default'],
          data: require('react-intl/locale-data/ko')
        }));
      }
      default: {
        return require.ensure([], () => resolve({
          messages: {},
          data: {},
        }))
      }
    }
  }));
}

function resolveRoute() {
  return new Promise((resolve, reject) => {
    match({ history, routes }, (error, redirectLocation, renderProps) => {
      if (error) return reject(error);
      resolve({ redirectLocation, renderProps });
    });
  });
}

Promise.all<LocaleData>([
  loadLocaleData(locale),
  resolveRoute(),
])
.then(([localeData]) => {
  addLocaleData(localeData.data);
  render(
    <IntlProvider locale={locale} messages={localeData.messages}>
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
})
.catch(error => {
  console.error(error);
});
