import 'babel-polyfill';
import * as Promise from 'bluebird';
Promise.config({ warnings: false });

import * as cookieParser from 'cookie-parser';
import * as axios from 'axios';

import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
const MuiThemeProvider = require('material-ui/lib/MuiThemeProvider');
const getMuiTheme = require('material-ui/lib/styles/getMuiTheme');

import { Provider } from 'react-redux';
const { ReduxAsyncConnect, loadOnServer } = require('redux-async-connect');
const { StyleRoot } = require('radium');
const Hairdresser = require('hairdresser');

import { IntlProvider } from 'react-intl';

import { Provider as HairdresserProvider } from './hairdresser';
import { Provider as SagaProvider } from './saga';

import * as express from 'express';
import * as compress from 'compression';
import * as fs from 'fs';
const template = require('lodash.template');
const locale = require('locale');
import { minify } from 'html-minifier';

import * as conf from '@pasta/config';

import { baseTheme, muiTheme } from './theme';
import configureStore from './store';
import getRoutes from './routes';

import {
  DELETE_TOKEN,
  LOGIN_SUCCEEDED, LoginSucceededAction,
} from './actions/auth';

import {
  USER_ADD, UserAddAction,
  USER_REMOVE, UserRemoveAction,
} from './actions/users';

import { callApiOnServer } from './api/saga';
import {
  ApiCall,
  ApiCallSpecFactory,
  makeInitialApiCall,
  MapParamsToProps,
  ApiSpecDictionary,
  ApiCallDictionary,
} from './api';

// To serve style file on webpack server
const styles = require('./styles.js');

const SUPPORTED_LOCALES = ['en', 'ko'];
locale.Locale['default'] = 'en';

function loadLocaleData(locale: string) {
  switch(locale) {
    case 'ko': {
      return require('./messages/ko').default;
    }
    default: {
      return {};
    }
  }
}

// Prepare compiled index html template
const indexHtml = __DEV__ ? require('raw!./index.html') : fs.readFileSync(`${__dirname}/index.html`, 'utf8');
const minifiedIndexHtml = minify(indexHtml, {
  collapseWhitespace: true,
  conservativeCollapse: true,
  collapseBooleanAttributes: true,
  removeCommentsFromCDATA: true,
  minifyCSS: true,
  minifyJS: true,
});
const compiledIndexHtml = template(minifiedIndexHtml, {
  interpolate: /{{([\s\S]+?)}}/g,
  imports: {
    styles,
    script: __DEV__ ? `<script src="http://localhost:${conf.consoleClientPort}/bundle.js"></script>` : '',
  }
});

const app = express();

app.use(compress());
app.use(locale(SUPPORTED_LOCALES));
app.use(cookieParser());
app.use('/assets', express.static(`${__dirname}/../public`));

app.get('*', async (req, res) => {
  try {
    const locale = req['locale'];

    const { store, sagaMiddleware } = configureStore();

    // Authenticate.
    const token = req.cookies.tt;
    if (token) {
      try {
        const res = await axios.get(`${CONFIG_AUTH_SERVER_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userAddAction: UserAddAction = {
          type: USER_ADD,
          user: {
            id: res.data.id,
            picture: res.data.picture,
          },
        };
        store.dispatch(userAddAction);

        const action: LoginSucceededAction = {
          type: LOGIN_SUCCEEDED,
          userid: res.data.id,
          username: res.data.name,
          token: token,
        };
        store.dispatch(action);
      } catch(error) {
        console.error(error);
      }
    }

    const { redirectLocation, renderProps } = await new Promise<any>((resolve, reject) => {
      match({ routes: getRoutes(store), location: req.url as any }, (err, redirectLocation, renderProps) => {
        if (err) { return reject(err); }
        resolve({ redirectLocation, renderProps });
      });
    });

    if (redirectLocation) {
      return res.redirect(302, redirectLocation.pathname + redirectLocation.search)
    }

    if (!renderProps) {
      return res.status(404).send('Not found');
    }

    const apiCalls: ApiCallDictionary = {};

    // Collect all sagas and actions to dispatch before initial load
    renderProps.components
      .filter(component => component && component['mapParamsToProps'])
      .forEach(component => {
        const mapParamsToProps: MapParamsToProps = component['mapParamsToProps'];
        const specs = mapParamsToProps(renderProps.params, renderProps.location);
        Object.keys(specs).forEach(key => {
          const spec = specs[key];
          if (!apiCalls[spec.id]) {
            apiCalls[spec.id] = makeInitialApiCall(spec.id, spec.options);
          }
        });
      });

    await Promise.map(Object.keys(apiCalls), (key => {
      const apiCall = apiCalls[key];
      return sagaMiddleware.run(callApiOnServer as any, apiCall).done;
    }), { concurrency: 10 });

    // You can also check renderProps.components or renderProps.routes for
    // your "not found" component or route respectively, and send a 404 as
    // below, if you're using a catch-all route.

    const userAgent = req.headers['user-agent'];
    const finalMuiTheme = getMuiTheme(baseTheme, Object.assign({}, muiTheme, { userAgent }));

    const hairdresser = new Hairdresser();

    const messages = loadLocaleData(locale);

    const body = renderToString(
      <IntlProvider locale={locale} messages={messages}>
        <HairdresserProvider hairdresser={hairdresser}>
          <MuiThemeProvider muiTheme={finalMuiTheme}>
            <Provider store={store}>
              <SagaProvider middleware={sagaMiddleware}>
                <StyleRoot radiumConfig={{ userAgent }}>
                  <RouterContext {...renderProps} />
                </StyleRoot>
              </SagaProvider>
            </Provider>
          </MuiThemeProvider>
        </HairdresserProvider>
      </IntlProvider>
    );

    const head = hairdresser.renderToString();

    // Delete token because token in store is used only on server
    store.dispatch({ type: DELETE_TOKEN });

    const html = compiledIndexHtml({
      locale,
      head,
      body,
      initialState: JSON.stringify(store.getState()),
    });

    res.status(200).send(html);
  } catch(err) {
    // TODO: Smart logging
    console.error(err.stack);
    res.status(500).send(err.message);
  }
});

app.listen(conf.consolePort, err => {
  if (err) {
    console.error(err.stack);
    process.exit(1);
  }
  console.log(`Listening at *:${conf.consolePort}`);
});
