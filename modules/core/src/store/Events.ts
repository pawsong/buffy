import GameObject from '../classes/GameObject';
import Terrain from '../classes/Terrain';
import { EventSubscription } from 'fbemitter';
import Vector3 from '../classes/Vector3';
import * as ZC from '../packet/ZC';
import { Mesh } from '../types';

export const StoreEvents = [
  'resync',
  'objectAdded',
  'objectRemoved',
  'move',
  'rotate',
  'playEffect',
  'terrainUpdated',
  'meshUpdated',
];

export interface StoreEmit {
  resync(): void;
  objectAdded(params: ObjectAddedParams): void;
  objectRemoved(params: ObjectRemovedParams): void;
  move(params: MoveParams): void;
  rotate(params: RotateParams): void;
  playEffect(params: PlayEffectParams): void;
  meshUpdated(params: MeshUpdatedParams): void;
  terrainUpdated(params: TerrainUpdateParams): void;
}

export interface StoreListen {
  resync(fn: () => any): EventSubscription;
  objectAdded(fn: (params: ObjectAddedParams) => any): EventSubscription;
  objectRemoved(fn: (params: ObjectRemovedParams) => any): EventSubscription;
  move(fn: (params: MoveParams) => any): EventSubscription;
  rotate(fn: (params: RotateParams) => any): EventSubscription;
  playEffect(fn: (params: PlayEffectParams) => any): EventSubscription;
  meshUpdated(fn: (params: MeshUpdatedParams) => any): EventSubscription;
  terrainUpdated(fn: (params: TerrainUpdateParams) => any): EventSubscription;
}

export interface StoreEventParams { }

export interface MoveParams extends StoreEventParams {
  object: GameObject;
}

export interface RotateParams extends StoreEventParams {
  object: GameObject;
  direction: Vector3;
}

export interface ObjectAddedParams extends StoreEventParams {
  object: GameObject;
}

export interface ObjectRemovedParams extends StoreEventParams {
  id: string;
}

export interface PlayEffectParams extends ZC.PlayEffectParams {

}

export interface MeshUpdatedParams extends StoreEventParams {
  designId: string;
  mesh: Mesh;
}

export interface TerrainUpdateParams extends StoreEventParams {
  terrain: Terrain;
}
