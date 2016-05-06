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
  designId;
}

class LocalServer {
  static createInitialData(options: CreateInitialDataOptions): SerializedLocalServer {
    const userId = shortid.generate();

    // const
    const serializedGameObject: SerializedGameObject = {
      id: userId,
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
      id: shortid.generate(),
      name: '',
      width: 10,
      depth: 10,
      terrains: [],
      objects: [serializedGameObject],
    };

    return {
      myId: userId,
      maps: [serializedGameMap],
    };
  }

  routes: LocalRoutes;
  myId: string;
  maps: ServerGameMap[];
  indexedMaps: { [index: string]: ServerGameMap }
  user: LocalUserGameObject;
  updateFrameId: number;

  constructor(data: SerializedLocalServer, socket: LocalSocket) {
    invariant(socket, 'Invalid socket');

    // Initialize maps and users
    this.myId = data.myId;

    this.indexedMaps = {};
    let serializedGameObject: SerializedGameObject;
    let userMapId: string;

    data.maps.forEach(datum => {
      let index = findIndex(datum.objects, { id: this.myId });

      if (index === -1) {
        this.indexedMaps[datum.id] = new ServerGameMap(datum);
      } else {
        serializedGameObject = datum.objects[index];
        userMapId = datum.id;

        this.indexedMaps[datum.id] = new ServerGameMap(update(datum, {
          objects: { $splice: [[index, 1]] },
        }));
      }
    });

    invariant(serializedGameObject && userMapId, 'Cannot find user in maps');

    const userMap = this.indexedMaps[userMapId];
    this.user = new LocalUserGameObject(serializedGameObject, userMap, socket);
    userMap.addUser(this.user);

    this.routes = new LocalRoutes(this.user, socket);

    // Arrayify maps for fast iteration.
    this.maps = Object.keys(this.indexedMaps).map(id => this.indexedMaps[id]);

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
      myId: this.myId,
      map: this.user.map.serialize(),
    };
  }

  serialize(): SerializedLocalServer {
    return {
      myId: this.myId,
      maps: this.maps.map(map => map.serialize()),
    };
  }

  destroy() {
    cancelAnimationFrame(this.updateFrameId);
    this.routes.destroy();
    this.routes = null;
  }
}

export default LocalServer;
