import * as ZC from '@pasta/interface/lib/ZC';
import { EventEmitter, EventSubscription } from 'fbemitter';
import GameObject from '@pasta/game-class/lib/GameObject';
import GameObjectManager from '@pasta/game-class/lib/GameObjectManager';

export interface Handlers {
  [index: string]: Function;
}

class StateStore extends EventEmitter {
  static Routes: Handlers = {};

  static on: ZC.Listen<StateStore> = (e, fn) => {
    StateStore.Routes[e] = fn;
  }

  objects: GameObjectManager;
  me: GameObject;

  constructor() {
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

StateStore.on('init', (store, params) => {
  store.emit('destroyAll');

  store.deserialize(params);

  store.objects.getAllObjects().forEach(object => {
    store.watchObject(object);
    store.emit('create', object);
  });

  // params.terrains.forEach(terrain => {
  //   store.emit('terrain', terrain);
  // });

  store.emit('init');
});

StateStore.on('move', (store, params) => {
  const object = store.objects.find(params.id);
  if (!object) {
    // TODO: Request missing object data to server.
    // Out of sync in this case. We may have to reset all data.
    console.error('Client and server out of sync!');
    console.error(`Cannot find object ${params.id}`);
    return;
  }
  object.tween.import(params.tween);
});

StateStore.on('create', (store, params) => {
  const object = store.objects.create(params);

  store.watchObject(object);
  store.emit('create', object);
});

StateStore.on('terrain', (store, params) => {
  store.emit('terrain', params.terrain);
});

StateStore.on('voxels', (store, params) => {
  store.emit('voxels', params);
});

export default StateStore;
