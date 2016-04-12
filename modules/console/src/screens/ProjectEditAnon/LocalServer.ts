import * as shortid from 'shortid';
import { EventEmitter } from 'fbemitter';
import { CZ, ZC } from '@pasta/core/lib/packet';
import Mesh from '@pasta/core/lib/classes/Mesh';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import GameObject from '@pasta/core/lib/classes/GameObject';
const objectAssign = require('object-assign');
import GameMap from './classes/ClientGameMap';
import GameUser from './classes/ClientGameUser';

function Listen(socket) {
  this.socket = socket;
}

Object.keys(CZ.Methods).forEach(method => {
  const opts = CZ.Methods[method];
  if (opts.response) {
    Listen.prototype[method] = function (handler) {
      this.socket.addListener(method, ({ params, fn }) => {
        const promise = handler(params);
        if (!promise || !promise.then) {
          console.error('handler must return Promise object to send back response');
          return fn({ error: new Error('500') });
        }

        // TODO: make RPC
        promise
          .then(result => fn({ result }))
          .catch(error => {
            console.error(error.stack || error);
            fn({ error: new Error('failed') });
          });
      });
    };
  } else {
    Listen.prototype[method] = function (handler) {
      this.socket.addListener(method, ({ params }) => handler(params));
    };
  }
})

const SPEED = 0.005;

class LocalServer {
  static USER_ID = 'my-id';

  // Sockets
  emitter: EventEmitter;
  srvEmitter: EventEmitter;

  // Local data
  map: GameMap;
  frameId: number;

  constructor(data?: SerializedGameMap) {
    this.emitter = new EventEmitter();
    this.srvEmitter = new EventEmitter();

    const userFilteredData = objectAssign({}, data, { objects: [] });

    // Initialize data
    this.map = new GameMap(userFilteredData);

    const me = new GameUser(this.emitter, '', data.objects[0]);

    this.map.addUser(me);
    me.map = this.map;

    let then = Date.now();
    const update = () => {
      this.frameId = requestAnimationFrame(update);
      const now = Date.now();
      this.map.update(now - then);
      then = now;
    };
    update();

    const listen: CZ.Listen = new Listen(this.srvEmitter);
    listen.move(async (params) => {
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

    listen.rotate(async (params) => {
      if (params.direction.x === 0 && params.direction.y === 0 && params.direction.z === 0 ) {
        console.warn('Invalid vector');
        return;
      }

      if (me.tween.isPlaying()) { me.tween.stop(); }
      me.map.broadcast.stop({ id: params.id });

      me.direction.deserialize(params.direction).normalize();

      me.map.broadcast.rotate({
        id: params.id,
        direction: me.direction.serialize(),
      });
    });

    listen.updateMesh(async (params) => {
      // TODO: Validate params.
      // TODO: Check permission.

      // Upsert
      if (me.mesh) {
        me.mesh.deserialize({
          id: me.mesh.id,
          vertices: params.vertices,
          faces: params.faces,
        });
      } else {
        me.mesh = new Mesh({
          id: 'my-mesh',
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

      const terrain = me.map.updateTerrain({
        id: shortid.generate(),
        position: { x: params.x, z: params.z },
        color: params.color,
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
  }

  getInitData(): ZC.InitParams {
    return {
      myId: LocalServer.USER_ID,
      map: this.map.serialize(),
    };
  }

  emit(event, params, fn) {
    this.srvEmitter.emit(event, { params, fn });
  }

  addListener(event, handler) {
    return this.emitter.addListener(event, handler);
  }

  serialize() {
    return this.map.serialize();
  }

  destroy() {
    cancelAnimationFrame(this.frameId);
  }
}

export default LocalServer;
