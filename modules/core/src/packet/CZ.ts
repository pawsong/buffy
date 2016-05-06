import * as Promise from 'bluebird';
import { RpcParams, RpcResponse } from './base';
import { SerializedVector3 } from '../classes/Vector3';
import { Mesh } from '../types';

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
  objectId: string;
  zoneId: string;
}

export interface PlayEffectParams extends RpcParams {
  objectId: string;
  x: number;
  z: number;
  duration: number;
}

export interface RotateParams extends RpcParams {
  id: string;
  direction: SerializedVector3;
}

export interface UpdateMeshParams extends RpcParams {
  objectId: string;
  designId: string;
  mesh: Mesh;
}

export interface UpdateTerrainParams extends RpcParams {
  objectId: string;
  x: number;
  z: number;
  color: number;
}

