import { EventEmitter, EventSubscription } from 'fbemitter';
import GameObject from './classes/GameObject';
import GameMap from './classes/GameMap';
import Terrain from './classes/Terrain';
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

  // myId: string;
  private zones: GameMap[];
  private indexedZones: { [index: string]: GameMap };
  objects: { [index: string]: GameObject };

  subscribe: StoreListen;

  constructor() {
    this.emitter = new EventEmitter();
    this.emit = new Emit(this.emitter);
    this.subscribe = new Subscribe(this.emitter);

    this.zones = [];
    this.indexedZones = {};
    this.objects = {};
  }


  deserialize(data: ZC.InitParams) {
    const indexedObject = {};
    data.objects.forEach(object => indexedObject[object.id] = object);

    data.zones.forEach(serialziedZone => {
      const zone = this.indexedZones[serialziedZone.id];
      if (zone) {
        // Replace
        zone.objects.forEach(object => {
          this.unwatchObject(object);
          delete this.objects[object.id];
        });

        const newZone = new GameMap(serialziedZone);
        serialziedZone.objects.forEach(objectId => {
          const object = this.objects[objectId] = new GameObject(indexedObject[objectId], newZone);
          newZone.addObject(object);
          this.watchObject(object);
        });

        const index = this.zones.indexOf(zone);
        this.zones.splice(index, 1, newZone);
        this.indexedZones[zone.id] = newZone;
      } else {
        // Append
        const newZone = new GameMap(serialziedZone);
        serialziedZone.objects.forEach(objectId => {
          const object = this.objects[objectId] = new GameObject(indexedObject[objectId], newZone);
          newZone.addObject(object);
          this.watchObject(object);
        });

        this.zones.push(newZone);
        this.indexedZones[newZone.id] = newZone;
      }
    });

    // console.log(data);

    // // Unwatch
    // const indexedData = {};
    // data.zones.forEach(zone => indexedData[zone.id] = zone);
    // const zonesToAppend = [];

    // this.zones.forEach((zone, index) => {
    //   const serialziedZone = indexedData[zone.id];
    //   if (serialziedZone) {
    //     zone.objects.forEach(object => this.unwatchObject(object));

    //     const newZone = new GameMap(serialziedZone);
    //     newZone.objects.forEach(object => this.watchObject(object));
    //     this.zones.splice(index, 1, newZone);
    //     this.indexedZones[zone.id] = newZone;
    //   } else {
    //     const newZone = new GameMap(serialziedZone);
    //     newZone.objects.forEach(object => this.watchObject(object));
    //     zonesToAppend.push(newZone);
    //   }
    // });
    // this.zones.push.apply(this.zones, zonesToAppend);
    // zonesToAppend.forEach(zone => this.indexedZones[zone.id] = zone);

    // console.log(this.zones);
    // console.log(zonesToAppend);
  }

  update(dt) {
    return this.zones.forEach(zone => zone.update(dt));
  }

  on(eventType: string, callback: Function): EventSubscription {
    return this.emitter.addListener(eventType, callback, this);
  }

  findObject(objectId: string) {
    return this.objects[objectId];
  }

  findZone(zoneId: string) {
    return this.indexedZones[zoneId];
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

  const zoneIds = params.zones.map(zone => zone.id);
  store.emit.resync({ zoneIds });
});

StateStore.on.move((store, params) => {
  const object = store.findObject(params.id);
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
  const object = store.findObject(params.id);
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
  const object = store.findObject(params.id);
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
  const zone = store.findZone(params.zoneId);
  const terrain = zone.updateTerrain(params.terrain);
  store.emit.terrainUpdated({ terrain });
});

StateStore.on.objectAdded((store, params) => {
  const zone = store.findZone(params.object.zone);
  const object = new GameObject(params.object, zone);
  object.zone.objects.push(object);
  store.objects[object.id] = object;

  store.watchObject(object);

  store.emit.objectAdded({ object });
});

StateStore.on.objectRemoved((store, params) => {
  const object = store.findObject(params.id);

  store.unwatchObject(object);

  delete store.objects[object.id];
  object.zone.removeObject(object);

  store.emit.objectRemoved({ id: params.id });
});

StateStore.on.robotUpdated((store, params) => {
  const objects: GameObject[] = [];

  Object.keys(store.objects)
    .map(key => store.objects[key])
    .filter(object => object.robot === params.robot)
    .forEach(object => {
      object.designId = params.design;
      objects.push(object);
    });

  store.emit.designChanged({
    objects,
  });
});
