import * as shortid from 'shortid';
import { CZ, ZC } from '@pasta/interface';
import objects from './ServerObjectManager';
import GameUser from './models/GameUser';
import Terrain from './models/Terrain';

import * as map from './map';

const SPEED = 0.005;

export default (io, socket) => {
  
  const listen: CZ.Listen = (method, handler) => {
    socket.on(method, handler);
  };
  
  const emit: ZC.Emit = (event, params) => {
    socket.emit(event, params);
  };
  
  const broadcast: ZC.Broadcast = (event, params) => {
    io.emit(event, params);
  };
  
  // TODO: Comprehensive session management needed.
  const alreadyConnected = !!objects.find(socket.user.id);
  if (alreadyConnected) {
    return socket.disconnect();
  }

  const user = objects.create(Object.assign({
    id: shortid.generate(),
  }, socket.user));

  // TODO Get terrain info from memory
  emit('init', {
    me: { id: user.id },
    objects: user.getSerializedObjectsInRange(),
    terrains: Object.keys(map.terrains).map(key => map.terrains[key]),
  });
  
  listen('move', params => {
    const dx = user.position.x - params.x;
    const dy = user.position.y - params.y;
    const dist = Math.sqrt(dx * dx + dy * dy)

    user.tween
      .to({ x: params.x, y: params.y }, dist / SPEED) // TODO: Calculate speed
      .start(0);

    broadcast('move', { id: user.id, tween: user.tween });
    
    return Promise.resolve();
  });
  
  listen('playEffect', (params) => {
    emit('create', {
      id: shortid.generate(),
      type: 'effect',
      position: {
        x: params.x,
        y: params.y,
      },
      duration: params.duration,
    });
  });

  listen('setTerrain', async (params) => {
    // TODO: Check permission
    const terrain = await Terrain.findOneAndUpdate({
      loc: { x: params.x, y: params.y },
    }, {
      color: params.color,
    }, { new: true, upsert: true }).exec();

    map.setTerrain(terrain);
    
    broadcast('terrain', { terrain });
  });
  
  listen('voxels', params => {
    broadcast('voxels', {id: user.id, data: params });
  });
  
  socket.on('disconnect', async function() {
    objects.destroy(user.id);
    try {
      await GameUser.findOneAndUpdate({ user: user.id }, {
        'loc.pos.x': Math.round(user.position.x),
        'loc.pos.y': Math.round(user.position.y),
      }).exec();
    } catch(err) {
      console.error(err);
    }
  });
};
