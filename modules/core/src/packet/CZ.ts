import { RpcParams, RpcResponse } from './base';

/*
 * Packet types:
 *   - Type 1: Does not wait response. Returns void
 *   - Type 2: Server sends back result to client. Returns Promise<Result>
 */
export const Methods = {
  playEffect: { response: false },
  move: { response: true },
  updateTerrain: { response: true },
  updateMesh: { response: true },
};

export interface Rpc {
  playEffect(params: PlayEffectParams): void;
  move(params: MoveParams): Promise<void>;
  updateTerrain(params: UpdateTerrainParams): Promise<void>;
  updateMesh(params: UpdateMeshParams): void;
}

export interface Listen {
  playEffect(fn: (params: PlayEffectParams) => void): void;
  move(fn: (params: MoveParams) => Promise<void>): void;
  updateTerrain(fn: (params: UpdateTerrainParams) => Promise<void>): void;
  updateMesh(fn: (params: UpdateMeshParams) => Promise<void>): void;
}

// Events
export interface PlayEffectParams extends RpcParams {
  x: number;
  z: number;
  duration: number;
}

export interface MoveParams extends RpcParams {
  id: string;
  x: number;
  z: number;
}

export interface UpdateTerrainParams extends RpcParams {
  x: number;
  z: number;
  color: number;
}

export interface UpdateMeshParams extends RpcParams {
  id: string;
  vertices: any[];
  faces: any[];
}
