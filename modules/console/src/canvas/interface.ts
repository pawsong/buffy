import * as THREE from 'three';
import { EventSubscription } from 'fbemitter';
import { Store } from 'redux';
import StateLayer from '@pasta/core/lib/StateLayer';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import ObjectManager from './ObjectManager';
import TerrainManager from './TerrainManager';

export interface Services {
  container: HTMLElement;
  objectManager: ObjectManager;
  terrainManager: TerrainManager;
  effectManager: any;
  camera: THREE.PerspectiveCamera;
  stateLayer: StateLayer;
  cubeGeometry: THREE.Geometry;
  cubeMaterial: THREE.Material;
  resyncToStore: Function;
  scene: THREE.Scene;
  // raycaster: THREE.Raycaster;
  // store: Store;
}

export interface StoreHandler {
  (listen: StoreListen, services: Services): EventSubscription;
}
