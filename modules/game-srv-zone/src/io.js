import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import iConfig from '@pasta/config-internal';
import TWEEN from '@pasta/tween.js';
import shortid from 'shortid';

import manager from './ServerObjectManager';

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

  const SPEED = 0.005;

  io.on('connection', function(socket) {
    const { user } = socket;

    const userObject = manager.create({ id: shortid.generate(), ...user });

    socket.emit('init', {
      me: { id: userObject.id },
      objects: userObject.getSerializedObjectsInRange(),
    });

    socket.on('move', msg => {

      const dx = userObject.position.x - msg.x;
      const dy = userObject.position.y - msg.y;
      const dist = Math.sqrt(dx * dx + dy * dy)

      userObject.tween
        .to({ x: msg.x, y: msg.y }, dist / SPEED) // TODO: Calculate speed
        .start(0);

      io.emit('move', { id: userObject.id, tween: userObject.tween });
    });

    socket.on('disconnect', function() {
      manager.destroy(userObject.id);
    });
  });

  manager.on('start', function (object) {
    console.log('start');
    // Broadcast tween data
    console.log(object.tween);
  });

  manager.on('move', function (object, to, from) {
    console.log('move');
    console.log(to);
    console.log(from);
    // Do we have to broadcast this?
    // Client is already thinking about it...
  });

  manager.on('stop', function (object) {
    console.log('stop');
  });
}
