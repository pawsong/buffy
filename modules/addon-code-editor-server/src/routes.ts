'use strict';

import * as fs from 'fs';
import * as _ from 'lodash';
import * as lodash from 'lodash';
import wrap from '@pasta/helper/lib/wrap';
import Script from './models/Script';
import * as axios from 'axios';
import * as conf from '@pasta/config';

const proxyRoot = '/addons/code-editor';

export default app => {
  // Some browsers does not allow to create Web Worker from cross origin code.
  // To go around that problem.
  app.post('/compile', wrap(async (req, res, next) => {
    const { source } = req.body;

    let result;
    try {
      result = await axios.post(`${conf.compilerUrl}/compile`, { source });
    } catch(err) {
      // Compile failed...
      console.log(err);
      return next(err);
    }

    const { bundle, sourceMap } = result.data;

    const owner = req.user ? req.user.id : '';

    // Temporarily save in DB
    const script = new Script({
      owner,
      bundle,
      sourceMap,
    });
    await script.save();

    res.send({
      url: `${proxyRoot}/worker/${script._id}`,
    });
  }));

  const envFile = 'worker.js';
  app.get(`/env/${envFile}`, (req, res) => {
    res.sendFile(`${__dirname}/${envFile}`);
  });

  const template = require('raw!./template.js');
  const compiledTmpl = _.template(template, {
    imports: { env: `${proxyRoot}/env/${envFile}` },
  });

  app.get('/worker/:id', wrap(async (req, res) => {
    const { id } = req.params;

    res.set('Content-Type', 'application/javascript')
      .send(compiledTmpl({
        compiled: `${proxyRoot}/compiled/${id}`,
      }));
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
