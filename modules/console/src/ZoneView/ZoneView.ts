import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import GameObject from '@pasta/core/lib/classes/GameObject';

import Canvas from '../Canvas';
import DesignManager from '../DesignManager';

import { createEffectManager } from './effects';
import { GetZoneViewState } from './interface';

// TODO Support dynamic grid size
import {
  PIXEL_NUM,
  PIXEL_UNIT,
  BOX_SIZE,
  MINI_PIXEL_SIZE,
  GRID_SIZE,
} from './Constants';

import * as handlers from './handlers';

interface Position {
  x: number; y: number; z: number;
}

abstract class ZoneView extends Canvas {
  effectManager: any;
  resyncToStore: (object: GameObject) => void;

  private tokens: any[];

  constructor(container: HTMLElement, stateLayer: StateLayer, designManager: DesignManager, getState: GetZoneViewState) {
    super(container, designManager);

    this.effectManager = createEffectManager(this.scene);

    // /////////////////////////////////////////////////////////////////////////
    // // Add event listeners
    // /////////////////////////////////////////////////////////////////////////

    this.resyncToStore = (player: GameObject) => {
      // Clear objects
      this.objectManager.removeAll();

      // Terrains
      for (let i = 1; i <= player.zone.width; ++i) {
        for (let j = 1; j <= player.zone.depth; ++j) {
          this.terrainManager.findAndUpdate(i, j, 0xffffff);
        }
      }

      player.zone.terrains.forEach(terrain => {
        this.terrainManager.findAndUpdate(terrain.position.x, terrain.position.z, terrain.color);
      });

      // Objects
      player.zone.objects.forEach(obj => {
        const object = this.objectManager.create(obj.id, obj.designId);
        object.add(new THREE.Mesh(this.cubeGeometry , this.cubeMaterial));

        const { group } = object;

        group.position.x = BOX_SIZE * obj.position.x -PIXEL_UNIT;
        group.position.z = BOX_SIZE * obj.position.z -PIXEL_UNIT;
        group.position.y = PIXEL_UNIT;

        group.lookAt(new THREE.Vector3(
          group.position.x + obj.direction.x,
          group.position.y + obj.direction.y,
          group.position.z + obj.direction.z
        ));

        if (obj.id === player.id) {
          this.setCameraPosition(group.position);
        }
      });
    }

    // // Sync view to store data
    const { playerId } = getState();
    const object = stateLayer.store.findObject(playerId);
    if (object) this.resyncToStore(object);

    this.tokens = Object.keys(handlers).map(key => handlers[key](stateLayer.store.subscribe, this, stateLayer, getState));
  }

  setCameraPosition(pos: Position) {
    this.camera.position.set(pos.x, pos.y, pos.z);
  }

  render(dt = 0) {
    this.effectManager.update(dt);
  }

  destroy() {
    this.tokens.forEach(token => token.remove());
    super.destroy();
  }
}

export default ZoneView;
