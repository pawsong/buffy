import * as THREE from 'three';
import { EventSubscription } from 'fbemitter';
import { Store } from 'redux';
import StateLayer from '@pasta/core/lib/StateLayer';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StateInterface } from './Fsm';
import ObjectManager from './ObjectManager';
import TerrainManager from './TerrainManager';
import CursorManager from './CursorManager';

export interface Services {
  container: HTMLElement;
  objectManager: ObjectManager;
  terrainManager: TerrainManager;
  effectManager: any;
  cursorManager: CursorManager;
  camera: THREE.OrthographicCamera;
  stateLayer: StateLayer;
  cubeGeometry: THREE.Geometry;
  cubeMaterial: THREE.Material;
  resyncToStore: Function;
  scene: THREE.Scene;
  raycaster: THREE.Raycaster;
  store: Store;
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
