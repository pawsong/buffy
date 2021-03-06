import 'babel-polyfill';
import Promise from 'bluebird';
Promise.config({ warnings: false });

require('react-tap-event-plugin')();
const useScroll = require('react-router-scroll');

import './vendor';

import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import { match } from 'react-router'
const { Router, applyRouterMiddleware }  = require('react-router');
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
const Hairdresser = require('hairdresser');
import { IntlProvider, addLocaleData } from 'react-intl';

import ContextProvider from './components/ContextProvider';
import { Provider as SagaProvider } from './saga';

import { baseTheme, muiTheme } from './theme';

import getRoutes from './routes';
import configureStore from './store';

import { EXPIRE_PRELOAD } from './api';

// To serve files on webpack server
require('!file!./favicon.ico');
require('./styles.js');

const initialState = window['__INTIAL_STATE__'];
delete window['__INTIAL_STATE__'];

const locale = window['__LOCALE__'];
delete window['__LOCALE__'];

const isMac = window['__IS_MAC__'];
delete window['__IS_MAC__'];

const { store, history, sagaMiddleware, onRouterUpdate } = configureStore(initialState);
const routes = getRoutes(store, __IS_MOBILE__);

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

  try {
    render(
      <IntlProvider locale={locale} messages={localeData.messages}>
        <ContextProvider hairdresser={hairdresser} insertCss={styles => styles._insertCss()} isMac={isMac}>
          <MuiThemeProvider muiTheme={finalMuiTheme}>
            <Provider store={store}>
              <SagaProvider middleware={sagaMiddleware}>
                <Router
                  history={history}
                  onUpdate={onRouterUpdate}
                  routes={routes}
                  render={applyRouterMiddleware(useScroll())}
                />
              </SagaProvider>
            </Provider>
          </MuiThemeProvider>
        </ContextProvider>
      </IntlProvider>,
      document.getElementById('content'),
      () => {
        const elem = document.getElementById('styleRenderedOnServer');
        if (elem) elem.parentNode.removeChild(elem);
      }
    );
    store.dispatch({ type: EXPIRE_PRELOAD });
  } catch(error) {
    console.error(error.stack || error);
    throw error;
  }
})
.catch(error => {
  // TODO: Display error view
});
