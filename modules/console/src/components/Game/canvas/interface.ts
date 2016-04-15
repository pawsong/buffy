import * as THREE from 'three';
import { EventSubscription } from 'fbemitter';
import { Store } from 'redux';
import StateLayer from '@pasta/core/lib/StateLayer';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StateInterface } from './Fsm';
import ObjectManager from './ObjectManager';
import TerrainManager from './TerrainManager';
import CursorManager from './CursorManager';

import { GameState } from '../interface';

export interface GameStateListener {
  (gameState: GameState): any;
}

export interface GameStateSelector<T> {
  (gameState: GameState): T;
}

export interface GameStateObserver<T> {
  (state: T): any;
}

export interface RemoveObserver {
  (): void;
}

export interface ObserveGameState {
  <T>(selector: GameStateSelector<T>, listener: GameStateObserver<T>): RemoveObserver;
}

export interface GetGameState {
  (): GameState;
}

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
  getGameState: GetGameState;
  observeGameState: ObserveGameState;
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
