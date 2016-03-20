import * as express from 'express'

export default function wrap(handler: express.RequestHandler) {
  return (req, res, next) => {
    handler(req, res, next).catch(next);
  };
};
