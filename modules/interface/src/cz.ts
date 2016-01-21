import { RpcParams, RpcResponse } from './base';

/*
 * Packet types:
 *   - Type 1: Does not wait response. Returns void
 *   - Type 2: Server sends back result to client. Returns Promise<Result>
 */
export const Methods = {
  playEffect: { response: false },
  move: { response: true },
  setTerrain: { response: true },
  voxels: { response: false },
};

export interface Rpc {
  playEffect(params: PlayEffectParams): void;
  move(params: MoveParams): Promise<void>;
  setTerrain(params: SetTerrainParams): Promise<void>;
  voxels(params: VoxelsParams): void;
}

export interface Listen {
  (method: 'playEffect', fn: (params: PlayEffectParams) => void): void;
  (method: 'move', fn: (params: MoveParams) => Promise<void>): void;
  (method: 'setTerrain', fn: (params: SetTerrainParams) => Promise<void>): void;
  (method: 'voxels', fn: (params: VoxelsParams) => void): void;


  (e: string, fn: (body: RpcParams) => any): void;
}

// Events
export interface PlayEffectParams extends RpcParams {
  x: number;
  y: number;
  duration: number;
}

export interface MoveParams extends RpcParams {
  id: string;
  x: number;
  y: number;
}

export interface SetTerrainParams extends RpcParams {
  x: number;
  y: number;
  color: number;
}

export interface VoxelsParams extends RpcParams {

}
