import express from 'express';
import bodyParser from 'body-parser';
import request from 'superagent';
import Script from '../models/Script';
import config from '@pasta/config';
import iConfig from '@pasta/config/internal';
import fs from 'fs';
import _ from 'lodash';

const compilerUrl = `${iConfig.compilerUrl}/compile`;

function wrap(handler) {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
}

const app = express();
app.use(bodyParser.json());

// Some browsers does not allow to create Web Worker from cross origin code.
// To go around that problem.
app.post('/compile', wrap(async (req, res, next) => {
  const { source } = req.body;

  let result;
  try {
    result = await request
      .post(compilerUrl)
      .send({ source })
      .exec();
  } catch(err) {
    // Compile failed...
    console.log(err);
    return next(err);
  }

  console.log(result);

  const owner = req.user ? req.user.id : '';

  // Temporarily save in DB
  const script = await new Script({
    owner,
    bundle: result.bundle,
    sourceMap: result.sourceMap,
  }).save();

  res.send({
    url: `/code/worker/${script._id}`,
  });
}));

let envFile;
let envFileHandler;

if (process.env.NODE_ENV === 'development') {
  envFile = 'worker.js';
  envFileHandler = (req, res, next) => {
    request
      .get(`http://localhost:${config.consoleWebpackWorkerPort}/worker.js`)
      .buffer(true)
      .end((err, resp) => {
        if (err) { return next(err); }
        res.set('Content-Type', 'application/javascript').send(resp.text);
      });
  };
} else {
  // TODO: In production mode, worker file name should be read in local file.
  envFile = 'worker.js';
  envFileHandler = (req, res) => {
    // Send local file
  };
}

app.get(`/env/${envFile}`, envFileHandler);

const template = fs.readFileSync(__dirname + '/template.js').toString();
const compiledTmpl = _.template(template, {
  imports: { env: `/code/env/${envFile}` },
});

app.get('/worker/:id', wrap(async (req, res) => {
  const { id } = req.params;

  res.set('Content-Type', 'application/javascript')
    .send(compiledTmpl({
      compiled: `/code/compiled/${id}`,
    }));
}));

app.get('/compiled/:id', wrap(async (req, res) => {
  const { id } = req.params;
  const script = await Script.findById(id);
  if (!script) {
    return res.status(404).send();
  }

  res.set('Content-Type', 'application/javascript').send(script.bundle);
}));

export default app;