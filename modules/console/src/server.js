import 'babel-polyfill';
import './patch/superagent';

import express from 'express';
import fs from 'fs';
import _ from 'lodash';
import request from 'superagent';
import Promise from 'bluebird';
import React from 'react';
import Hairdresser from 'hairdresser';
import jwt from 'express-jwt';
import cookieParser from 'cookie-parser';

import { renderToString } from 'react-dom/server'
import { match, RoutingContext } from 'react-router'

import { createStore } from 'redux';
import { Provider } from 'react-redux';
import routes from './routes';

import rootReducer from './reducers';

import config from '@pasta/config-public';
import iConfig from '@pasta/config-internal';

import { provideHairdresserContext } from './hairdresser';

import api from './api';
import code from './code';

import mongoose from 'mongoose';
import User from './models/User';

const HairdresserProvider = provideHairdresserContext(Provider);

function loadStaticAsset(file, webpackServerPort) {
  return new Promise((resolve, reject) => {
    if (process.env.NODE_ENV === 'development') {
      request.get(`http://localhost:${webpackServerPort}/${file}`).end(function(err, res){
        if (err) { return reject(err); }
        resolve(res.text);
      });
    } else {
      const text = readFileSync(`__dirname/${file}`).toString();
      resolve(text);
    }
  });
}

(async () => {
  mongoose.connect(iConfig.mongoUri);

  const template = await loadStaticAsset(
    'index.html',
    iConfig.consoleWebpackAppPort
  );

  const compiled = _.template(template);

  const app = express();
  app.use('/assets', express.static(__dirname + '/../public'));
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

      const user = !req.user ? null : await User.findById(req.user.id);
      store.dispatch({ type: 'SET_USER_DATA', user })

      const { redirectLocation, renderProps } = await new Promise((resolve, reject) => {
        // Note that req.url here should be the full URL path from
        // the original request, including the query string.
        match({
          routes: routes(store),
          location: req.url
        }, (err, redirectLocation, renderProps) => {
          if (err) { return reject(err); }
          resolve({ redirectLocation, renderProps });
        });
      });

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
      res.status(500).send();
    }
  });

  await new Promise((resolve, reject) => {
    app.listen(iConfig.consolePort, err => err ? reject(err) : resolve());
  });

  console.log(`Listening at *:${iConfig.consolePort}`);
})().catch(err => {
  console.error(err.stack);
});
