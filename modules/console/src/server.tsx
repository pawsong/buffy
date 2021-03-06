import 'babel-polyfill';
import * as Promise from 'bluebird';
Promise.config({ warnings: false });

import * as cookieParser from 'cookie-parser';
import * as axios from 'axios';

import * as React from 'react';
import { renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';

import { Provider } from 'react-redux';
const Hairdresser = require('hairdresser');

import { IntlProvider } from 'react-intl';

import { Provider as SagaProvider } from './saga';

import * as express from 'express';
import * as compress from 'compression';
import * as fs from 'fs';
const template = require('lodash/template');
const locale = require('locale');
import { minify } from 'html-minifier';

import * as conf from '@pasta/config';

import { baseTheme, muiTheme } from './theme';
import configureStore from './store';
import getRoutes from './routes';

import ContextProvider from './components/ContextProvider';

const isMobile = require('ismobilejs');

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

const favicon = require('!file!./favicon.ico');
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
  minifyJS: true,
});
const compiledIndexHtml = template(minifiedIndexHtml, {
  evaluate:    /\{\{(.+?)\}\}/g,
  interpolate: /\{\{=(.+?)\}\}/g,
  escape:      /\{\{-(.+?)\}\}/g,
  imports: {
    favicon,
    styles,
    script: __DEV__ ? (() => {
      return `<script src="http://${require('ip').address()}:${conf.consoleClientPort}/bundle.js"></script>`;
    })() : '',
  }
});

const app = express();

// For site ownership verification
app.get('/googlec789d0222e8b30cc.html', (req, res) => {
  res.send('google-site-verification: googlec789d0222e8b30cc.html');
});

app.use(compress());
app.use(locale(SUPPORTED_LOCALES));
app.use(cookieParser());
app.use('/assets', express.static(`${__dirname}/../public`));

app.get('*', async (req, res) => {
  try {
    const clientIsMobile = req.headers['user-agent'] && isMobile(req.headers['user-agent']).any || false;
    const locale = req['locale'];

    const { store, sagaMiddleware } = configureStore();

    // Authenticate.
    const token = req.cookies.tt;
    if (token) {
      try {
        const res = await axios.get(`${CONFIG_API_SERVER_URL}/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const userAddAction: UserAddAction = {
          type: USER_ADD,
          user: {
            id: res.data.id,
            email: res.data.email || '',
            name: res.data.name || '',
            username: res.data.username || '',
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
      match({ routes: getRoutes(store, clientIsMobile), location: req.url as any }, (err, redirectLocation, renderProps) => {
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
        const mapParamsToProps: MapParamsToProps<any> = component['mapParamsToProps'];
        const specs = mapParamsToProps(renderProps.params, renderProps.location);
        if (!specs) return;

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

    const isMac = /Mac OS X/.test(userAgent);

    const hairdresser = new Hairdresser();

    const messages = loadLocaleData(locale);

    const css = [];
    function insertCss(styles) {
      css.push(styles._getCss());
    }

    const body = renderToString(
      <IntlProvider locale={locale} messages={messages}>
        <ContextProvider hairdresser={hairdresser} insertCss={insertCss} isMac={isMac}>
          <MuiThemeProvider muiTheme={finalMuiTheme}>
            <Provider store={store}>
              <SagaProvider middleware={sagaMiddleware}>
                <RouterContext {...renderProps} />
              </SagaProvider>
            </Provider>
          </MuiThemeProvider>
        </ContextProvider>
      </IntlProvider>
    );

    const head = hairdresser.renderToString();

    // Delete token because token in store is used only on server
    store.dispatch({ type: DELETE_TOKEN });

    const html = compiledIndexHtml({
      locale,
      css: css.join(''),
      head,
      body,
      isMobile: clientIsMobile,
      isMac,
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
