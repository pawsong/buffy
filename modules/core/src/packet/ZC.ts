import { SerializedGameMap } from '../classes/GameMap';
import { SerializedGameObject } from '../classes/GameObject';
import { SerializedTerrain } from '../classes/Terrain';
import { SerializedVector3 } from '../classes/Vector3';
import { Mesh } from '../types';
import { RpcParams, RpcResponse } from './base';
import * as CZ from './CZ';

/*
 * Packet types:
 *   - Type 1: Does not wait response. Returns void
 *   - Type 2: Check if server received or not. Returns Promise<void>
 *   - Type 3: Server sends back result to client. Returns Promise<Result>
 */

export const SendEvents = [
  'init',
];

export interface Send {
  init(params: InitParams): void;
}

export const BroadcastEvents = [
  'move',
  'stop',
  'rotate',
  'objectAdded',
  'objectRemoved',
  'playEffect',
  'terrainUpdated',
  'meshUpdated',
];

export interface Broadcast {
  move(params: MoveParams): void;
  stop(params: StopParams): void;
  rotate(params: RotateParams): void;
  objectAdded(params: ObjectAddedParams): void;
  objectRemoved(params: ObjectRemovedParams): void;
  playEffect(params: PlayEffectParams): void;
  terrainUpdated(params: TerrainUpdatedParams): void;
  meshUpdated(params: MeshUpdatedParams): void;
}

export interface Listen<T> {
  init(fn: (store: T, params: InitParams) => any): void;
  move(fn: (store: T, params: MoveParams) => any): void;
  stop(fn: (store: T, params: StopParams) => any): void;
  rotate(fn: (store: T, params: RotateParams) => any): void;
  objectAdded(fn: (store: T, params: ObjectAddedParams) => any): void;
  objectRemoved(fn: (store: T, params: ObjectRemovedParams) => any): void;
  playEffect(fn: (store: T, params: PlayEffectParams) => any): void;
  terrainUpdated(fn: (store: T, params: TerrainUpdatedParams) => any): void;
  meshUpdated(fn: (store: T, params: MeshUpdatedParams) => any): void;
}

// Events
export interface InitParams extends RpcParams {
  zones: SerializedGameMap[];
  objects: SerializedGameObject[];
}

export interface MoveParams extends RpcParams {
  id;
  tween;
}

export interface StopParams extends RpcParams {
  id: string;
}

export interface RotateParams extends RpcParams {
  id: string;
  direction: SerializedVector3;
}

export interface ObjectAddedParams extends RpcParams {
  object: SerializedGameObject;
}

export interface ObjectRemovedParams extends RpcParams {
  id: string;
}

export interface PlayEffectParams extends CZ.PlayEffectParams {

}

export interface TerrainUpdatedParams extends RpcParams {
  zoneId: string;
  terrain: SerializedTerrain;
}

export interface MeshUpdatedParams extends RpcParams {
  designId: string;
  mesh: Mesh;
}

// Responses
export interface Type3Response extends RpcResponse { }
