import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import iConfig from '@pasta/config-internal';
import TWEEN from '@pasta/tween.js';

import routes from './routes';

export default io => {
  io.use(function (socket, next) {
    const cookies = cookie.parse(socket.request.headers.cookie);
    const token = cookies.tt;

    jwt.verify(token, iConfig.jwtSecret, (err, decoded) => {
      if (err) {
        return next(new Error('Authentication error'));
      }

      // TODO: Load object from db.
      socket.user = {
        position: { x: 0, y: 0 },
      };
      next();
    });
  });

  io.on('connection', function(socket) {
    return routes(io, socket);
  });
}
