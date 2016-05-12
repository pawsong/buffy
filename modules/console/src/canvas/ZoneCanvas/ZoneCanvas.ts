import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import GameObject from '@pasta/core/lib/classes/GameObject';

import Canvas from '../Canvas';
import DesignManager from '../DesignManager';

import Chunk from './Chunk';

import { createEffectManager } from './effects';
import { GetZoneViewState } from './interface';

// TODO Support dynamic grid size
import {
  PIXEL_NUM,
  PIXEL_UNIT,
  BOX_SIZE,
  MINI_PIXEL_SIZE,
  GRID_SIZE,
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../Constants';

import * as handlers from './handlers';

interface Position {
  x: number; y: number; z: number;
}

abstract class ZoneCanvas extends Canvas {
  effectManager: any;
  resyncToStore: (object: GameObject) => void;

  // TODO: Support multiple chunks.
  chunk: Chunk;

  protected stateLayer: StateLayer;

  private tokens: any[];
  private getZoneViewState;

  constructor(container: HTMLElement, designManager: DesignManager, stateLayer: StateLayer, getState: GetZoneViewState) {
    super(container, designManager);
    this.stateLayer = stateLayer;
    this.getZoneViewState = getState;
  }

  init() {
    super.init();

    this.chunk = new Chunk(this.scene, 16);

    for (let y = 1; y <= 2; ++y) {
      for (let x = 1; x <= 16; ++x) {
        for (let z = 1; z <= 16; ++z) {
          this.chunk.findAndUpdate([x, y, z], { r: 100, g: 100, b: 0 });
        }
      }
    }
    for (let x = 1; x <= 16; ++x) {
      for (let z = 1; z <= 16; ++z) {
        this.chunk.findAndUpdate([x, 3, z], { r: 0, g: 100, b: 0 });
      }
    }

    const geometry = this.chunk.update();

    this.effectManager = createEffectManager(this.scene);

    // /////////////////////////////////////////////////////////////////////////
    // // Add event listeners
    // /////////////////////////////////////////////////////////////////////////

    this.resyncToStore = (player: GameObject) => {
      // Clear objects
      this.objectManager.removeAll();

      // Terrains
      // for (let i = 1; i <= player.zone.width; ++i) {
      //   for (let j = 1; j <= player.zone.depth; ++j) {
      //     this.terrainManager.findAndUpdate(i, j, 0xffffff);
      //   }
      // }

      // player.zone.terrains.forEach(terrain => {
      //   this.terrainManager.findAndUpdate(terrain.position.x, terrain.position.z, terrain.color);
      // });

      // Objects
      player.zone.objects.forEach(obj => {
        const object = this.objectManager.create(obj.id, obj.designId);
        const mesh = new THREE.Mesh(this.cubeGeometry , this.cubeMaterial);
				mesh.castShadow = true;

        object.add(mesh);

        const { group } = object;

        group.position.x = obj.position.x * PIXEL_SCALE - PIXEL_SCALE_HALF;
        group.position.y = obj.position.y * PIXEL_SCALE - PIXEL_SCALE_HALF;
        group.position.z = obj.position.x * PIXEL_SCALE - PIXEL_SCALE_HALF;

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
    const { playerId } = this.getZoneViewState();
    const object = this.stateLayer.store.findObject(playerId);
    if (object) this.resyncToStore(object);

    this.tokens = Object.keys(handlers).map(key => handlers[key](
      this.stateLayer.store.subscribe, this, this.stateLayer, this.getZoneViewState));
  }

  addCameraPosition(pos: Position) {
    this.camera.position.add(<THREE.Vector3>(pos));
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

export default ZoneCanvas;
