import { SerializedGameMap } from '@pasta/game-class/lib/GameMap';
import { SerializedTerrain } from '@pasta/game-class/lib/Terrain';
import { RpcParams, RpcResponse } from './base';
import * as CZ from './cz';

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
  'create',
  'playEffect',
  'terrainUpdated',
  'meshUpdated',
];

export interface Broadcast {
  move(params: MoveParams): void;
  create(params: CreateParams): void;
  playEffect(params: PlayEffectParams): void;
  terrainUpdated(params: TerrainUpdatedParams): void;
  meshUpdated(params: MeshUpdatedParams): void;
}

export interface Listen<T> {
  init(fn: (store: T, params: InitParams) => any): void;
  move(fn: (store: T, params: MoveParams) => any): void;
  create(fn: (store: T, params: CreateParams) => any): void;
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

export interface CreateParams extends RpcParams {
  id: string;
  type: string;
  position: {
    x: number;
    z: number;
  },
  duration: number;
}

export interface PlayEffectParams extends CZ.PlayEffectParams {

}

export interface TerrainUpdatedParams extends RpcParams {
  terrain: SerializedTerrain;
}

export interface MeshUpdatedParams extends RpcParams {
  id: string;
  vertices: any[];
  faces: any[];
}

// Responses
export interface Type3Response extends RpcResponse { }
