import 'babel-polyfill';
import './patch/es.node';

import './patch/superagent';

import * as express from 'express';
import * as fs from 'fs';
import * as _ from 'lodash';
import * as request from 'superagent';
import * as Promise from 'bluebird';
import * as React from 'react';
import * as Hairdresser from 'hairdresser';
import * as jwt from 'express-jwt';
import * as cookieParser from 'cookie-parser';

import { renderToString } from 'react-dom/server'
import { match, RoutingContext } from 'react-router'

import { createStore } from 'redux';
import { Provider } from 'react-redux';
import routes from './routes';

import rootReducer from './reducers';

import conf from '@pasta/config-public';
import * as iConfig from '@pasta/config';

import { provideHairdresserContext } from './hairdresser';

import api from './api';
import code from './code';

import mongodb from '@pasta/mongodb';
import User from '@pasta/mongodb/lib/models/User';

const HairdresserProvider = provideHairdresserContext(Provider);

(async () => {
  mongodb.mongoose.connect(iConfig.mongoUri);

  const template = fs.readFileSync(`${__dirname}/client/index.html`).toString();

  const compiled = _.template(template, {
    imports: { facebookAppId: conf.facebookAppId },
  });

  const app = express();
  if (process.env.NODE_ENV !== 'production') {
    app.use('/public', express.static(`${__dirname}/client/public`));
  }
  app.use('/assets', express.static(`${__dirname}/../../public`));
  app.use('/api', api);

  app.use(cookieParser());

  app.use(jwt({
    secret: iConfig.jwtSecret,
    credentialsRequired: false,
    getToken: req => req.cookies.tt,
  })),

  app.use('/code', code);

  //// Register server-side rendering middleware
  //// -----------------------------------------------------------------------------
  app.get('*', async (req, res, next) => {
    try {
      const store = createStore(rootReducer);

      let user;
      if (!req.user) {
        user = null;
      } else if (req.user.anonymous) {
        user = {
          id: req.user.id,
          profile: '',
        };
      } else {
        user = await User.findById(req.user.id);
      }

      store.dispatch({ type: 'SET_USER_DATA', user })

      // function match(args: MatchArgs, cb: (error: any, nextLocation: H.Location, nextState: MatchState) => void): void

      const matchRet = await new Promise<{
        redirectLocation: any;
        renderProps: any;
      }>((resolve, reject) => {
        // Note that req.url here should be the full URL path from
        // the original request, including the query string.
        match({
          routes: routes(store),
          location: req.url as any,
        }, (err, redirectLocation, renderProps) => {
          if (err) { return reject(err); }
          resolve({ redirectLocation, renderProps });
        });
      });
      const redirectLocation = matchRet.redirectLocation;
      const renderProps = matchRet.renderProps;

      if (redirectLocation) {
        return res.redirect(302, redirectLocation.pathname + redirectLocation.search)
      }

      if (!renderProps) {
        return res.status(404).send('Not found')
      }

      const requests = renderProps.components
        .filter(component => component && component.fetchData)
        .map(component => component.fetchData());

      await Promise.all(requests);

      const hairdresser = Hairdresser.create();

      global.navigator = {
        userAgent: req.headers['user-agent']
      };

      const body = renderToString(
        <HairdresserProvider store={store} hairdresser={hairdresser}>
          <RoutingContext {...renderProps} />
        </HairdresserProvider>
      );

      const head = hairdresser.renderToString();
      const initialState = store.getState();

      const result = compiled({
        body,
        head,
        initialState: JSON.stringify(initialState),
      });

      res.send(result);
    } catch(err) {
      console.error(err.stack);
      res.send(500);
    }
  });

  await new Promise((resolve, reject) => {
    app.listen(iConfig.consolePort, err => err ? reject(err) : resolve());
  });

  console.log(`Listening at *:${iConfig.consolePort}`);
})().catch(err => {
  console.error(err.stack);
});
