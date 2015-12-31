import * as express from 'express';

export default function (app: express.Application) {
  app.get('/', function (req, res, next) {
    res.send({ message: 'Hello! This is admin page.' });
  })
};
