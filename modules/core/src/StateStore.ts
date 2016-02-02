import { EventEmitter, EventSubscription } from 'fbemitter';
import GameObject from './classes/GameObject';
import GameMap from './classes/GameMap';
import Mesh from './classes/Mesh';
import { StoreEvents, StoreEmit, StoreListen } from './store/Events';
import * as ZC from './packet/ZC';

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

  constructor(data: ZC.InitParams) {
    this.emitter = new EventEmitter();
    this.emit = new Emit(this.emitter);
    this.subscribe = new Subscribe(this.emitter);

    this.deserialize(data);
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
    return this.map.update(dt);
  }

  on(eventType: string, callback: Function): EventSubscription {
    return this.emitter.addListener(eventType, callback, this);
  }

  getPlayer(): GameObject {
    return this.map.findObject(this.myId);
  }

  private watchObject(object: GameObject) {
    object.tween.onStart(() => {
      // this.emit('start', object);
    });

    object.tween.onUpdate((value, newPos) => {
      this.emit.move({
        object,
        to: newPos,
        from: object.position,
      });
    });

    object.tween.onStop(() => {
      // this.emit('stop', object);
    });
  };

  private unwatchObject(object: GameObject) {
    object.tween.onStart(null);
    object.tween.onUpdate(null);
    object.tween.onStop(null);
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

StateStore.on.meshUpdated((store, params) => {
  // TODO: Save to store memory
  const object = store.map.findObject(params.id);
  if (!object) {
    // TODO: Request missing object data to server.
    // Out of sync in this case. We may have to reset all data.
    console.error('Client and server out of sync!');
    console.error(`Cannot find object ${params.id}`);
    return;
  }

  if (object.mesh) {
    object.mesh.deserialize(params.mesh);
  } else {
    object.mesh = new Mesh(params.mesh);
  }

  store.emit.meshUpdated({ object });
});

StateStore.on.playEffect((store, params) => {
  store.emit.playEffect(params);
});

// StateStore.on('create', (store, params) => {
//   const object = store.objects.create(params);

//   store.watchObject(object);
//   store.emit('create', object);
// });