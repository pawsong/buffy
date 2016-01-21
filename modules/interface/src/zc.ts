import { RpcParams, RpcResponse } from './base';

/*
 * Packet types:
 *   - Type 1: Does not wait response. Returns void
 *   - Type 2: Check if server received or not. Returns Promise<void>
 *   - Type 3: Server sends back result to client. Returns Promise<Result>
 */

export interface Emit {
  (e: 'init', params: InitParams): void;

  (e: string, params: RpcParams): any;
}

export interface Broadcast {
  (e: 'move', params: MoveParams): void;
  (e: 'create', params: CreateParams): void;
  (e: 'terrain', params: TerrainParams): void;
  (e: 'voxels', params: VoxelsParams): void;

  (e: string, params: RpcParams): any;
}

export interface Listen<T> {
  (e: 'init', fn: (store: T, params: InitParams) => void): void;
  (e: 'move', fn: (store: T, params: MoveParams) => void): void;
  (e: 'create', fn: (store: T, params: CreateParams) => void): void;
  (e: 'terrain', fn: (store: T, params: TerrainParams) => void): void;
  (e: 'voxels', fn: (store: T, params: VoxelsParams) => void): void;
  
  (e: string, fn: (store: T, params: RpcParams) => any): void;
}

// Events
export interface InitParams extends RpcParams {
  me: any;
  objects: any;
  terrains: any;
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
    y: number;
  },
  duration: number;
}

export interface TerrainParams extends RpcParams {
  terrain;
}

export interface VoxelsParams extends RpcParams {
  id: string;
  data;
}

// Responses
export interface Type3Response extends RpcResponse { }
