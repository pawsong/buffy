import * as shortid from 'shortid';
const objectAssign = require('object-assign');
const update = require('react-addons-update');
const findIndex = require('lodash/findIndex');
const invariant = require('invariant');

import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import ServerGameMap from '@pasta/core/lib/packet/ServerGameMap';
import { SerializedGameObject } from '@pasta/core/lib/classes/GameObject';
import { InitParams } from '@pasta/core/lib/packet/ZC';
import { SerializedLocalServer } from '@pasta/core/lib/Project';

import LocalUserGameObject from './LocalUserGameObject';
import LocalRoutes from './LocalRoutes';
import LocalSocket from './LocalSocket';

interface CreateInitialDataOptions {
  playerId: string;
  robot: string;
  designId: string;
}

class LocalServer {
  static createInitialData(options: CreateInitialDataOptions): SerializedLocalServer {
    const zoneId = shortid.generate();

    // const
    const serializedGameObject: SerializedGameObject = {
      id: options.playerId,
      zone: zoneId,
      robot: options.robot,
      designId: options.designId,
      position: {
        x: 1,
        y: 0,
        z: 1,
      },
      direction: { x: 0, y: 0, z: 1 },
    };

    const userId2 = shortid.generate();

    const serializedGameObject2: SerializedGameObject = {
      id: userId2,
      zone: zoneId,
      robot: options.robot,
      designId: options.designId,
      position: {
        x: 1,
        y: 0,
        z: 1,
      },
      direction: { x: 0, y: 0, z: 1 },
    };

    // Initialize data
    const serializedGameMap: SerializedGameMap = {
      id: zoneId,
      name: '',
      width: 10,
      depth: 10,
      terrains: [],
      objects: [serializedGameObject.id, serializedGameObject2.id],
    };

    return {
      zones: [serializedGameMap],
      objects: [serializedGameObject, serializedGameObject2],
    };
  }

  routes: LocalRoutes;
  maps: ServerGameMap[];
  indexedMaps: { [index: string]: ServerGameMap };
  users: { [index: string]: LocalUserGameObject };
  updateFrameId: number;

  constructor(data: SerializedLocalServer, socket: LocalSocket) {
    invariant(socket, 'Invalid socket');

    // Initialize maps and users

    this.maps = [];
    this.indexedMaps = {};
    this.users = {};

    data.zones.forEach(datum => {
      const zone = this.indexedMaps[datum.id] = new ServerGameMap(datum);
      this.maps.push(zone);
    });

    data.objects.forEach(serializedObject => {
      const zone = this.indexedMaps[serializedObject.zone];
      const user = new LocalUserGameObject(serializedObject, zone, socket);
      this.users[user.id] = user;
      zone.addUser(user);
    });

    this.routes = new LocalRoutes(Object.keys(this.users).map(key => this.users[key]), socket);

    // Start loop.
    let then = Date.now();
    const updateMaps = () => {
      this.updateFrameId = requestAnimationFrame(updateMaps);
      const now = Date.now();
      this.maps.forEach(map => map.update(now - then));
      then = now;
    };
    updateMaps();
  }

  getInitData(): InitParams {
    return {
      zones: this.maps.map(map => map.serialize()),
      objects: Object.keys(this.users).map(key => this.users[key].serialize()),
    };
  }

  serialize(): SerializedLocalServer {
    return {
      zones: this.maps.map(map => map.serialize()),
      objects: Object.keys(this.users).map(key => this.users[key].serialize()),
    };
  }

  destroy() {
    cancelAnimationFrame(this.updateFrameId);
    this.routes.destroy();
    this.routes = null;
  }
}

export default LocalServer;
