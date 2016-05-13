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

import StateStore from '@pasta/core/lib/StateStore';

import LocalUserGameObject from './LocalUserGameObject';
import LocalRoutes from './LocalRoutes';
import LocalSocket from './LocalSocket';

import { RecipeEditorState } from '../components/RecipeEditor';
import { WorldEditorState } from '../components/WorldEditor';
import { SourceFileDB } from '../components/Studio/types';

interface CreateInitialDataOptions {
  playerId: string;
  robot: string;
  designId: string;
}

class LocalServer extends StateStore {
  routes: LocalRoutes;

  zones: ServerGameMap[];
  indexedZones: { [index: string]: ServerGameMap };
  objects: { [index: string]: LocalUserGameObject };

  updateFrameId: number;

  constructor(files: SourceFileDB, worldId: string, socket: LocalSocket) {
    super();

    invariant(socket, 'Invalid socket');

    const worldFile = files[worldId];
    const world: WorldEditorState = worldFile.state;

    // Initialize maps and users

    Object.keys(world.zones).map(id => world.zones[id]).forEach(zoneState => {
      const blocks: Int32Array = zoneState.blocks.data;

      const zone = this.indexedZones[zoneState.id] = new ServerGameMap({
        id: zoneState.id,
        name: zoneState.name,
        width: zoneState.size[0],
        depth: zoneState.size[2],
        size: zoneState.size,
        blocks: blocks.slice().buffer, // Copy buffer to preserve original state in file.
        terrains: [],
        objects: [],
      });
      this.zones.push(zone);
    });

    Object.keys(world.robots).map(id => world.robots[id]).forEach(robotState => {
      const recipeFile = files[robotState.recipe];
      const recipe: RecipeEditorState = recipeFile.state;

      const zone = this.indexedZones[robotState.zone];
      const user = new LocalUserGameObject({
        id: robotState.id,
        zone: robotState.zone,
        robot: robotState.recipe,
        designId: recipe.design,
        position: {
          x: robotState.position[0],
          y: robotState.position[1],
          z: robotState.position[2],
        },
        direction: {
          x: robotState.direction[0],
          y: robotState.direction[1],
          z: robotState.direction[2],
        },
      }, zone, socket);
      this.objects[user.id] = user;
      zone.addUser(user);
    });

    this.routes = new LocalRoutes(Object.keys(this.objects).map(key => this.objects[key]), socket);

    // Start loop.
    let then = Date.now();
    const updateMaps = () => {
      this.updateFrameId = requestAnimationFrame(updateMaps);
      const now = Date.now();
      this.zones.forEach(map => map.update(now - then));
      then = now;
    };
    updateMaps();
  }

  getInitData(): InitParams {
    return {
      zones: this.zones.map(map => map.serialize()),
      objects: Object.keys(this.objects).map(key => this.objects[key].serialize()),
    };
  }

  serialize(): SerializedLocalServer {
    return {
      zones: this.zones.map(map => map.serialize()),
      objects: Object.keys(this.objects).map(key => this.objects[key].serialize()),
    };
  }

  destroy() {
    cancelAnimationFrame(this.updateFrameId);
    this.routes.destroy();
    this.routes = null;
  }
}

export default LocalServer;
