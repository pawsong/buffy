import { SerializedGameMap } from '../classes/GameMap';
import { SerializedGameObject } from '../classes/GameObject';
import { SerializedTerrain } from '../classes/Terrain';
import { SerializedMesh } from '../classes/Mesh';
import { SerializedVector3 } from '../classes/Vector3';
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
  'create',
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
  create(params: CreateParams): void;
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
  create(fn: (store: T, params: CreateParams) => any): void;
  objectAdded(fn: (store: T, params: ObjectAddedParams) => any): void;
  objectRemoved(fn: (store: T, params: ObjectRemovedParams) => any): void;
  playEffect(fn: (store: T, params: PlayEffectParams) => any): void;
  terrainUpdated(fn: (store: T, params: TerrainUpdatedParams) => any): void;
  meshUpdated(fn: (store: T, params: MeshUpdatedParams) => any): void;
}

// Events
export interface InitParams extends RpcParams {
  myId: string;
  map: SerializedGameMap;
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

export interface CreateParams extends RpcParams {
  id: string;
  type: string;
  position: {
    x: number;
    z: number;
  },
  duration: number;
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
  terrain: SerializedTerrain;
}

export interface MeshUpdatedParams extends RpcParams {
  id: string;
  mesh: SerializedMesh;
}

// Responses
export interface Type3Response extends RpcResponse { }
