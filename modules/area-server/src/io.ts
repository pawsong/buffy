import * as cookie from 'cookie';
import * as jwt from 'jsonwebtoken';
import * as conf from '@pasta/config';
import * as TWEEN from '@pasta/tween.js';
import GameUser from './models/GameUser';
import * as Promise from 'bluebird';

import routes from './routes';

export default io => {
  io.use(async function (socket, next) {
    try {
      const cookies = cookie.parse(socket.request.headers.cookie);
      const token = cookies['tt'];

      const decoded = await new Promise<{id: string}>((resolve, reject) => {
        jwt.verify(token, conf.jwtSecret, (err, decoded) => {
          err ? reject(err) : resolve(decoded);
        });
      });

      let user = await GameUser.findOne({ user: decoded.id }).exec();
      if (!user) {
        user = await GameUser.create({ user: decoded.id });
      }
      socket.user = {
        id: decoded.id,
        position: { x: user.loc.pos.x || 0, y: user.loc.pos.y || 0 },
      };
      next();
    } catch(err) {
      next(err);
    }
  });

  io.on('connection', function(socket) {
    return routes(io, socket);
  });
}
