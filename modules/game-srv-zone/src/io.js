import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import iConfig from '@pasta/config-internal';
import TWEEN from '@pasta/tween.js';
import {
  User,
} from '@pasta/mongodb';

import routes from './routes';

export default io => {
  io.use(function (socket, next) {
    const cookies = cookie.parse(socket.request.headers.cookie);
    const token = cookies.tt;

    (async () => {
      const decoded = await new Promise((resolve, reject) => {
        jwt.verify(token, iConfig.jwtSecret, (err, user) => err ? reject(err) : resolve(user));
      });

      // TODO: Load object from db.
      socket.user = {
        position: { x: 0, y: 0 },
      };
    })().then(next).catch(next);
  });

  io.on('connection', function(socket) {
    return routes(io, socket);
  });
}
