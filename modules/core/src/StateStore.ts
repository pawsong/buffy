import { EventEmitter, EventSubscription } from 'fbemitter';
import GameObject, { SerializedGameObject } from './classes/GameObject';
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
  emitter: EventEmitter;
  emit: StoreEmit;

  subscribe: StoreListen;

  protected indexedZones: { [index: string]: GameMap };
  protected zones: GameMap[];
  protected objects: { [index: string]: GameObject };

  constructor() {
    this.zones = [];
    this.indexedZones = {};
    this.objects = {};

    this.emitter = new EventEmitter();
    this.emit = new Emit(this.emitter);
    this.subscribe = new Subscribe(this.emitter);
  }

  deserialize(data: ZC.InitParams) {
    const indexedObject = {};
    data.objects.forEach(object => indexedObject[object.id] = object);

    data.zones.forEach(serialziedZone => {
      const zone = this.indexedZones[serialziedZone.id];
      if (zone) {
        // Replace
        zone.forEachObject(object => {
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

  forEachObject(handler: (object: GameObject) => any) {
    const objects = Object.keys(this.objects)
      .map(key => this.objects[key]).forEach(handler);
  }

  addObject(serialized: SerializedGameObject): GameObject {
    const zone = this.findZone(serialized.zone);
    const object = new GameObject(serialized, zone);
    object.zone.addObject(object);

    this.objects[object.id] = object;
    this.watchObject(object);
    return object;
  }

  removeObject(objectId: string) {
    const object = this.findObject(objectId);
    if (!object) return;

    this.unwatchObject(object);
    delete this.objects[object.id];
    object.zone.removeObject(object.id);
  }

  protected watchObject(object: GameObject) {
    object.onMove(() => this.emit.move({ object }));
  };

  protected unwatchObject(object: GameObject) {
    object.removeAllListeners();
  }
}

export default StateStore;
