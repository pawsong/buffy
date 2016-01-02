import * as shortid from 'shortid';
import objects from './ServerObjectManager';
import {
  User,
  Terrain,
} from '@pasta/mongodb';

import * as map from './map';

const SPEED = 0.005;

export default (io, socket) => {
  // TODO: Comprehensive session management needed.
  const alreadyConnected = !!objects.find(socket.user.id);
  if (alreadyConnected) {
    return socket.disconnect();
  }

  const user = objects.create(Object.assign({
    id: shortid.generate(),
  }, socket.user));

  // TODO Get terrain info from memory
  socket.emit('init', {
    me: { id: user.id },
    objects: user.getSerializedObjectsInRange(),
    terrains: Object.keys(map.terrains).map(key => map.terrains[key]),
  });

  socket.on('move', msg => {
    const dx = user.position.x - msg.x;
    const dy = user.position.y - msg.y;
    const dist = Math.sqrt(dx * dx + dy * dy)

    user.tween
      .to({ x: msg.x, y: msg.y }, dist / SPEED) // TODO: Calculate speed
      .start(0);

    io.emit('move', { id: user.id, tween: user.tween });
  });

  socket.on('playEffect', msg => {
    io.emit('create', {
      id: shortid.generate(),
      type: 'effect',
      position: {
        x: msg.x,
        y: msg.y,
      },
      duration: msg.duration,
    });
  });

  socket.on('disconnect', function() {
    objects.destroy(user.id);

    User.findByIdAndUpdate(user.id, {
      'loc.pos.x': Math.round(user.position.x),
      'loc.pos.y': Math.round(user.position.y),
    }).exec().catch(err => {
      console.error(err);
    });
  });

  socket.on('voxels', data => {
    socket.emit('voxels', { id: user.id, data });
  });

  socket.on('setTerrain', async (msg) => {
    // TODO: Check permission
    const terrain = await Terrain.findOneAndUpdate({
      loc: { x: msg.x, y: msg.y },
    }, {
      color: msg.color,
    }, { new: true, upsert: true }).exec();

    map.setTerrain(terrain);
    io.emit('terrain', { terrain });
  });
};
