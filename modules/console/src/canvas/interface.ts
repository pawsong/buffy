import * as THREE from 'three';
import { EventSubscription } from 'fbemitter';
import { Store } from 'redux';
import StateLayer from '@pasta/core/lib/StateLayer';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import ObjectManager from './ObjectManager';
import TerrainManager from './TerrainManager';

export interface StoreHandler<T> {
  (listen: StoreListen, view: T, stateLayer: StateLayer): EventSubscription;
}
