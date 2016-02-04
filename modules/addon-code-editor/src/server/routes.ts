'use strict';

import * as fs from 'fs';
import * as _ from 'lodash';
import * as lodash from 'lodash';
import wrap from '@pasta/helper/lib/wrap';
import Script from './models/Script';
import * as axios from 'axios';
import * as conf from '@pasta/config';
import * as path from 'path';
import * as express from 'express';

const root = require('pkg-dir').sync(__dirname);
const proxyRoot = '/addons/code-editor';

export default (app: express.Express) => {
  if (process.env.NODE_ENV !== 'production') {
    const proxy = require('http-proxy').createProxyServer();

    app.get('/', (req, res) => {
      res.redirect(`http://localhost:${conf.addonCodeEditorClientPort}/client.js`);
    });

    // Web worker security policy requires source must be served from same origin
    app.get('/worker.js', (req, res, next) => {
      proxy.web(req, res, { target: `http://localhost:${conf.addonCodeEditorWorkerPort}` }, next);
    });
  } else {
    app.get('/', (req, res) => {
      res.sendFile(`${__dirname}/client.js`);
    });

    app.get('/worker.js', (req, res) => {
      res.sendFile(`${__dirname}/worker.js`);
    });
  }

  // Serve libraries to be consumed by worker.
  app.use('/jspm_packages', express.static(path.resolve(root, 'jspm_packages')));

  // Some browsers does not allow to create Web Worker from cross origin code.
  // To go around that problem.
  app.post('/compile', wrap(async (req, res, next) => {
    const { source } = req.body;
    const owner = req.user ? req.user.id : '';

    // Temporarily save in DB
    const script = new Script({
      owner,
      bundle: source,
      sourceMap: '',
    });
    await script.save();

    res.send({
      url: `${proxyRoot}/compiled/${script._id}`,
    });
  }));

  app.get('/compiled/:id', wrap(async (req, res) => {
    const { id } = req.params;
    const script = await Script.findById(id).exec();
    if (!script) {
      return res.sendStatus(404);
    }
    res.set('Content-Type', 'application/javascript').send(script.bundle);
  }));
};
