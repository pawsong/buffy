import * as THREE from 'three';
import { EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StateInterface } from './Fsm';
import ObjectManager from './ObjectManager';
import TerrainManager from './TerrainManager';

export interface Services {
  container: HTMLElement;
  objectManager: ObjectManager;
  terrainManager: TerrainManager;
  effectManager: any;
  camera: THREE.OrthographicCamera;
  stateLayer: StateLayer;
  cubeGeometry: THREE.Geometry;
  cubeMaterial: THREE.Material;
  resyncToStore: Function;
  scene: THREE.Scene;
  raycaster: THREE.Raycaster;
}

export interface StoreHandler {
  (listen: StoreListen, services: Services): EventSubscription;
}

export interface ToolStateFactory {
  (services: Services): ToolState;
}

export interface ToolState extends StateInterface {
  isIntersectable?: (args?: any) => any;
  onMouseDown?: (args?: any) => any;
  onMouseUp?: (args?: any) => any;
  onInteract?: (args?: any) => any;
}
