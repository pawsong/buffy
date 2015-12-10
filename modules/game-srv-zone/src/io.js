import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import iConfig from '@pasta/config-internal';
import TWEEN from '@pasta/tween.js';
import {
  User,
} from '@pasta/mongodb';
import Promise from 'bluebird';

import routes from './routes';

const jwtVerify = Promise.promisify(jwt.verify);

export default io => {
  io.use(function (socket, next) {
    const cookies = cookie.parse(socket.request.headers.cookie);
    const token = cookies.tt;

    jwtVerify(token, iConfig.jwtSecret).then(decoded => {
      return User.findById(decoded.id).exec();
    }).then(user => {
      socket.user = {
        id: user.id,
        position: { x: user.loc.pos.x || 0, y: user.loc.pos.y || 0 },
      };
    }).then(next).catch(next);
  });

  io.on('connection', function(socket) {
    return routes(io, socket);
  });
}
