import { RpcParams, RpcResponse } from './base';
import { SerializedVector3 } from '../classes/Vector3';

export interface RpcMethod<T, U> {
  (params: T): Promise<U>;
}

export const Methods = [
  'move',
  'moveMap',
  'playEffect',
  'rotate',
  'updateMesh',
  'updateTerrain',
];

// RPC
export interface Rpc {
  move: RpcMethod<MoveParams, void>;
  moveMap: RpcMethod<MoveMapParams, void>;
  playEffect: RpcMethod<PlayEffectParams, void>;
  rotate: RpcMethod<RotateParams, void>;
  updateMesh: RpcMethod<UpdateMeshParams, void>;
  updateTerrain: RpcMethod<UpdateTerrainParams, void>;
}

// Payload
export interface MoveParams extends RpcParams {
  id: string;
  x: number;
  z: number;
}

export interface MoveMapParams extends RpcParams {
  id: string;
}

export interface PlayEffectParams extends RpcParams {
  x: number;
  z: number;
  duration: number;
}

export interface RotateParams extends RpcParams {
  id: string;
  direction: SerializedVector3;
}

export interface UpdateMeshParams extends RpcParams {
  id: string;
  vertices: any[];
  faces: any[];
}

export interface UpdateTerrainParams extends RpcParams {
  x: number;
  z: number;
  color: number;
}

