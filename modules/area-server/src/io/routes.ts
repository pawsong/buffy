import * as shortid from 'shortid';
import { CZ, ZC } from '@pasta/core/lib/packet';
import GameMap from '@pasta/core/lib/classes/GameMap';
import Mesh from '@pasta/core/lib/classes/Mesh';
import GameUser from '../classes/GameUser';
import GameMapModel from '../models/GameMap';
import GameUserModel from '../models/GameUser';
import MeshModel from '../models/Mesh';
import Terrain from '../models/Terrain';
import * as Sessions from '../Sessions';
import * as GameMapManager from '../GameMapManager';

const SPEED = 0.005;

function Listen(socket) {
  this.socket = socket;
}

Object.keys(CZ.Methods).forEach(method => {
  const opts = CZ.Methods[method];
  if (opts.response) {
    Listen.prototype[method] = function (handler) {
      this.socket.on(method, (params, fn) => {
        const promise = handler(params);
        if (!promise || !promise.then) {
          console.error(
            `handler must return Promise object to send back response`
          );
          return fn({
            error: new Error('500'),
          });
        }

        // TODO: make RPC
        promise.then(result => fn({
          result,
        })).catch(error => {
          console.error(error);
          fn({
            error: new Error('failed'),
          });
        });
      });
    };
  } else {
    Listen.prototype[method] = function (handler) {
      this.socket.on(method, handler);
    };
  }
})

export default (socket: SocketIO.Socket) => {
  const me: GameUser = socket['user'];
  socket['user'] = undefined;

  const listen: CZ.Listen = new Listen(socket);

  me.send.init({
    myId: me.id,
    map: me.map.serialize(),
  });

  listen.move(async (params) => {
    // TODO: Validate params.
    // TODO: Check permission.

    if (typeof params.id !== 'string') {
      console.warn('params.id must be string');
      return;
    }

    if (typeof params.x !== 'number') {
      console.warn('params.x must be number');
      return;
    }

    if (typeof params.z !== 'number') {
      console.warn('params.z must be number');
      return;
    }

    const dx = me.position.x - params.x;
    const dz = me.position.z - params.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    me.tween
      .to({ x: params.x, z: params.z }, dist / SPEED) // TODO: Calculate speed
      .start(0);

    me.map.broadcast.move({
      id: params.id,
      tween: me.tween.serialize(),
    });
  });

  listen.moveMap(async (params) => {
    const map = await GameMapManager.findOrCreate(params.id);

    me.map.removeUser(me);

    me.send.init({
      myId: me.id,
      map: map.serialize(),
    });

    // TODO: Move user to map's gate position
    me.map = map;
    me.position.x = 1;
    me.position.z = 1;
    map.addUser(me);
  });

  listen.updateMesh(async (params) => {
    // TODO: Validate params.
    // TODO: Check permission.

    // Upsert
    if (me.mesh) {
      await MeshModel.findByIdAndUpdate(me.mesh.id, {
        vertices: params.vertices,
        faces: params.faces,
      }).exec();

      me.mesh.deserialize({
        id: me.mesh.id,
        vertices: params.vertices,
        faces: params.faces,
      });
    } else {
      const meshDoc = await MeshModel.create({
        vertices: params.vertices,
        faces: params.faces,
      });

      await GameUserModel.findByIdAndUpdate(me.id, {
        mesh: meshDoc.id,
      }).exec();

      me.mesh = new Mesh({
        id: meshDoc.id,
        vertices: params.vertices,
        faces: params.faces,
      });
    }

    // TODO: Save values to DB.
    me.map.broadcast.meshUpdated({
      id: me.id,
      mesh: me.mesh.serialize(),
    });
  });

  listen.updateTerrain(async (params) => {
    // TODO: Validate params.
    // TODO: Check permission.

    const terrainDoc = await Terrain.findOneAndUpdate({
      map: me.map.id,
      loc: { x: params.x, z: params.z },
    }, {
      color: params.color,
    }, { new: true, upsert: true }).exec();

    const terrain = me.map.updateTerrain({
      id: terrainDoc.id,
      position: terrainDoc.loc,
      color: terrainDoc.color,
    });

    me.map.broadcast.terrainUpdated({
      terrain: terrain.serialize(),
    });
  });

  listen.playEffect(params => {
    // TODO: Validate params.
    // TODO: Check permission.

    me.map.broadcast.playEffect({
      x: params.x,
      z: params.z,
      duration: params.duration,
    });
  });

  socket.on('disconnect', async () => {
    Sessions.logout(me.id);
    me.map.removeUser(me);
    try {
      await GameUserModel.findByIdAndUpdate(me.id, {
        'loc.pos.x': me.position.x,
        'loc.pos.y': me.position.y,
        'loc.pos.z': me.position.z,
        'loc.dir.x': me.direction.x,
        'loc.dir.y': me.direction.y,
        'loc.dir.z': me.direction.z,
      }).exec();
    } catch(err) {
      console.error(err);
    }
  });

  /*

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

  */
};
