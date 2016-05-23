import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import StateStore from '@pasta/core/lib/StateStore';
import GameObject from '@pasta/core/lib/classes/GameObject';

import Canvas from '../Canvas';
import ModelManager from '../ModelManager';
import ObjectManager from './ObjectManager';

import Chunk from './Chunk';

import { createEffectManager } from './effects';
import { GetZoneViewState } from './interface';

import { StoreHandler } from './interface';

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
  resyncToStore: () => void;

  // TODO: Support multiple chunks.
  chunk: Chunk;

  objectManager: ObjectManager;
  modelManager: ModelManager;

  private tokens: any[];
  private getZoneViewState: GetZoneViewState;
  private boundRender: () => any;

  constructor(container: HTMLElement, modelManager: ModelManager, getState: GetZoneViewState) {
    super(container);
    this.modelManager = modelManager;
    this.getZoneViewState = getState;

    this.boundRender = this.render.bind(this);
  }

  init() {
    super.init();
    const objectManager = this.objectManager = new ObjectManager(this.scene, this.modelManager);

    this.chunk = new Chunk(this.scene);
    this.effectManager = createEffectManager(this.scene);
    this.modelManager.listenUpdate(this.boundRender);
  }

  connectToStateStore(store: StateStore) {
    this.disconnectFromStateStore();
    this.resyncToStateStore(store);

    this.tokens = Object.keys(handlers).map(key => {
      const handler: StoreHandler<ZoneCanvas> = handlers[key];

      return handler({
        canvas: this,
        store: store,
        getState: this.getZoneViewState,
      })
    });
  }

  disconnectFromStateStore() {
    if (!this.tokens) return;

    this.tokens.forEach(token => token.remove());
    this.tokens = null;
  }

  resyncToStateStore(store: StateStore) {
    const state = this.getZoneViewState();
    const player = store.findObject(state.playerId);
    if (!player) return;

    // Clear objects
    this.objectManager.removeAll();

    this.chunk.setData(player.zone.blocks);
    this.chunk.update();

    // Objects
    player.zone.objects.forEach(obj => {
      const object = this.objectManager.create(obj.id, obj.designId);
      // const mesh = new THREE.Mesh(this.cubeGeometry , this.cubeMaterial);
      // mesh.castShadow = true;

      // object.add(mesh);

      const { group } = object;

      group.position.x = obj.position.x * PIXEL_SCALE + PIXEL_SCALE_HALF;
      group.position.y = obj.position.y * PIXEL_SCALE + PIXEL_SCALE_HALF;
      group.position.z = obj.position.z * PIXEL_SCALE + PIXEL_SCALE_HALF;

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
    this.disconnectFromStateStore();
    this.modelManager.unlistenUpdate(this.boundRender);
    super.destroy();
  }
}

export default ZoneCanvas;
