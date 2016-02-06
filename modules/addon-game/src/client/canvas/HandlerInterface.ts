import * as THREE from 'three';
import { EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';

import ObjectManager from './ObjectManager';

export interface Services {
  objectManager: ObjectManager;
  effectManager: any;
  camera: THREE.OrthographicCamera;
  stateLayer: StateLayer;
  cubeGeometry: THREE.Geometry;
  cubeMaterial: THREE.Material;
  resyncToStore: Function;
}

export interface StoreHandler {
  (listen: StoreListen, services: Services): EventSubscription;
}
