import { compose } from 'compose-middleware/lib';
import * as ejwt from 'express-jwt';
import * as createError from 'http-errors';
import * as conf from '@pasta/config';

import User from '../models/User';

function getToken(req) {
  if (req.cookies && req.cookies.tt) {
    return req.cookies.tt;
  }

  if (req.headers && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length !== 2) {
      throw new Error('Format is Authorization: Bearer [token]');
    }

    const scheme = parts[0];
    const credentials = parts[1];

    if (!/^Bearer$/i.test(scheme)) {
      throw new Error('Format is Authorization: Bearer [token]');
    }
    return credentials;
  }
  return '';
}

export const requiresLogin = compose(ejwt({
  secret: conf.jwtSecret,
  getToken: getToken,
}), function (req, res, next) {
  User.findById(req.user.id, (err, user) => {
    if (err) return next(err);
    if (!user) return next(createError(403));

    req.userDoc = user;
    return next();
  });
});
