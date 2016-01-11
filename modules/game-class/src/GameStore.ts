import GameObjectManager from './GameObjectManager';
import GameObject from './GameObject';
import { EventEmitter, EventSubscription } from 'fbemitter';

export interface RouteHandler {
  (data: any): void;
}

class GameStore extends EventEmitter {
  static Routes: { [index: string]: RouteHandler } = {};

  static handle(event: string, handler: RouteHandler) {
    GameStore.Routes[event] = handler;
  };

  objects: GameObjectManager;
  me: GameObject;
  _emitter: any;

  constructor() {
    // EventEmitter takes no init argument.
    super();
    this.objects = new GameObjectManager(GameObject);
  }
  
  on(eventType: string, callback: Function): EventSubscription {
    return this.addListener(eventType, callback, this);
  }

  serialize() {
    return {
      me: this.me,
      objects: this.objects.serialize(),
    };
  }

  deserialize(data) {
    const { me, objects } = data;

    this.me = me;
    this.objects.deserialize(objects);
  }

  getPlayer() {
    return this.objects.find(this.me.id);
  }

  update(dt) {
    return this.objects.update(dt);
  }

  connect(emitter) {
    if (this._emitter) {
      throw new Error('Already connected');
    }
    this._emitter = emitter;

    Object.keys(GameStore.Routes).forEach(event => {
      emitter.on(event, GameStore.Routes[event].bind(this));
    });
    return this;
  }

  propagate(handler) {
    if (!this._emitter) {
      throw new Error('Not connected');
    }

    const events = Object.keys(GameStore.Routes);

    const listeners = {};
    events.forEach(event => {
      const listener = listeners[event] = data => handler(event, data);
      this._emitter.on(event, listener);
    });

    // Stop listening function
    return () => {
      events.forEach(event => {
        const listener = listeners[event];
        this._emitter.off(event, listener);
      });
    };
  }

  watchObject(object) {
    object.tween.onStart(() => {
      this.emit('start', object);
    });

    object.tween.onUpdate((value, newPos) => {
      this.emit('move', object, newPos, object.position);
    });

    object.tween.onStop(() => {
      this.emit('stop', object);
    });
  };
}

/*
 * Socket event handlers
 */
GameStore.handle('init', function (data) {
  this.emit('destroyAll');

  this.deserialize(data);

  this.objects.getAllObjects().forEach(object => {
    this.watchObject(object);
    this.emit('create', object);
  });

  data.terrains.forEach(terrain => {
    this.emit('terrain', terrain);
  });

  this.emit('init');
});

GameStore.handle('create', function (data) {
  const object = this.objects.create(data);

  this.watchObject(object);
  this.emit('create', object);
});

GameStore.handle('move', function (data) {
  const object = this.objects.find(data.id);
  if (!object) {
    // TODO: Request missing object data to server.
    // Out of sync in this case. We may have to reset all data.
    console.error('Client and server out of sync!');
    console.error(`Cannot find object ${data.id}`);
    return;
  }
  object.tween.import(data.tween);
});

GameStore.handle('terrain', function(data) {
  this.emit('terrain', data.terrain);
});

GameStore.handle('voxels', function (data) {
  this.emit('voxels', data);
});

export default GameStore;
