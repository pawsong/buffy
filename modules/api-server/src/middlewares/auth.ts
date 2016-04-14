import * as conf from '@pasta/config';
import * as ejwt from 'express-jwt';

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

export const requiresLogin = ejwt({
  secret: conf.jwtSecret,
  getToken: getToken,
});
