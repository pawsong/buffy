import { EventEmitter, EventSubscription } from 'fbemitter';
import GameObject from './classes/GameObject';
import GameMap from './classes/GameMap';
import Terrain from './classes/Terrain';
import Mesh from './classes/Mesh';
import { StoreEvents, StoreEmit, StoreListen } from './store/Events';
import * as ZC from './packet/ZC';
import invariant = require('invariant');

function Emit(emitter) {
  this.emitter = emitter;
}

StoreEvents.forEach(event => {
  Emit.prototype[event] = function (params) {
    return this.emitter.emit(event, params);
  };
});

function Subscribe(emitter: EventEmitter) {
  this.emitter = emitter;
}

StoreEvents.forEach(event => {
  Subscribe.prototype[event] = function (fn) {
    return this.emitter.addListener(event, fn);
  };
});

export interface Handlers {
  [index: string]: Function;
}

class StateStore {
  static Routes: Handlers = {};
  static on = (() => {
    const On = {} as ZC.Listen<StateStore>;
    ZC.SendEvents.concat(ZC.BroadcastEvents).forEach(event => {
      On[event] = function(handler) {
        StateStore.Routes[event] = handler;
      };
    });
    return On;
  })();

  emitter: EventEmitter;
  emit: StoreEmit;

  myId: string;
  map: GameMap;

  subscribe: StoreListen;

  constructor() {
    this.emitter = new EventEmitter();
    this.emit = new Emit(this.emitter);
    this.subscribe = new Subscribe(this.emitter);

    this.myId = '';
    this.map = null;
  }

  serialize(): ZC.InitParams {
    return {
      myId: this.myId,
      map: this.map.serialize(),
    };
  }

  deserialize(data: ZC.InitParams) {
    // Unwatch
    if (this.map) {
      this.map.objects.forEach(obj => this.unwatchObject(obj));
    }

    this.myId = data.myId;
    this.map = new GameMap(data.map);
    this.map.objects.forEach(obj => this.watchObject(obj));
  }

  update(dt) {
    if (process.env.NODE_ENV !== 'production') {
      invariant(this.map, 'Update must be executed after store initialization');
    }
    return this.map.update(dt);
  }

  on(eventType: string, callback: Function): EventSubscription {
    return this.emitter.addListener(eventType, callback, this);
  }

  getPlayer(): GameObject {
    return this.map.findObject(this.myId);
  }

  watchObject(object: GameObject) {
    object.onMove(() => this.emit.move({ object }));
  };

  unwatchObject(object: GameObject) {
    object.removeAllListeners();
  }
}

export default StateStore;

StateStore.on.init((store, params) => {
  console.warn('resync');
  store.deserialize(params);
  store.emit.resync();
});

StateStore.on.move((store, params) => {
  const object = store.map.findObject(params.id);
  if (!object) {
    // TODO: Request missing object data to server.
    // Out of sync in this case. We may have to reset all data.
    console.error('Client and server out of sync!');
    console.error(`Cannot find object ${params.id}`);
    return;
  }
  object.tween.deserialize(params.tween);
});

StateStore.on.stop((store, params) => {
  const object = store.map.findObject(params.id);
  if (!object) {
    // TODO: Request missing object data to server.
    // Out of sync in this case. We may have to reset all data.
    console.error('Client and server out of sync!');
    console.error(`Cannot find object ${params.id}`);
    return;
  }
  object.tween.stop();
});

StateStore.on.rotate((store, params) => {
  const object = store.map.findObject(params.id);
  if (!object) {
    // TODO: Request missing object data to server.
    // Out of sync in this case. We may have to reset all data.
    console.error('Client and server out of sync!');
    console.error(`Cannot find object ${params.id}`);
    return;
  }

  // TODO: Perform rotation during multiple frames
  object.direction.deserialize(params.direction);

  store.emit.rotate({
    object,
    direction: object.direction,
  });
});

StateStore.on.meshUpdated((store, params) => {
  store.emit.meshUpdated(params);
});

StateStore.on.playEffect((store, params) => {
  store.emit.playEffect(params);
});

StateStore.on.terrainUpdated((store, params) => {
  const terrain = store.map.updateTerrain(params.terrain);
  store.emit.terrainUpdated({ terrain });
});

StateStore.on.objectAdded((store, params) => {
  const obj = new GameObject(params.object);
  store.map.objects.push(obj);
  store.watchObject(obj);
  store.emit.objectAdded({ object: obj });
});

StateStore.on.objectRemoved((store, params) => {
  const obj = store.map.findObject(params.id);
  store.unwatchObject(obj);
  store.map.removeObject(obj);
  store.emit.objectRemoved({ id: params.id });
});
