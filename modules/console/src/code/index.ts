import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as axios from 'axios';
import Script from '@pasta/mongodb/lib/models/Script';
import * as conf from '@pasta/config';
import * as fs from 'fs';
import * as _ from 'lodash';

const compilerUrl = `${conf.compilerUrl}/compile`;

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
    result = await axios.post(compilerUrl, { source });
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
    url: `/code/worker/${script._id}`,
  });
}));

let envFile;
if (process.env.NODE_ENV !== 'production') {
  envFile = 'worker.js';
  const fileContent = fs.readFileSync(`${__dirname}/client/public/${envFile}`).toString();
  app.get(`/env/${envFile}`, (req, res) => {
    res.send(fileContent);
  });
} else {
  const manifest = require(`${__dirname}/../../build/prod/client/public/manifest.json`);
  envFile = manifest['worker.js'];
  const fileContent = fs.readFileSync(`${__dirname}/client/public/${envFile}`).toString();
  app.get(`/env/${envFile}`, (req, res) => {
    res
      .set('Content-Type', 'application/javascript')
      .set('Cache-Control', 'public, max-age=31536000')
      .send(fileContent);
  });
}

const template = require('raw!./template.js');
// fs.readFileSync(__dirname + '/template.js').toString();
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
  const script = await Script.findById(id).exec();
  if (!script) {
    return res.status(404).send();
  }

  res.set('Content-Type', 'application/javascript').send(script.bundle);
}));

export default app;
