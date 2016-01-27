import GameObject from '@pasta/game-class/lib/GameObject';
import { Position } from '@pasta/game-class/lib/GameObject';
import * as ZC from '@pasta/interface/lib/zc';

export const StoreEvents = [
  'resync',
  'move',
  'playEffect',
  'meshUpdated',
];

export interface StoreEmit {
  resync(): void;
  move(params: MoveParams): void;
  playEffect(params: PlayEffectParams): void;
  meshUpdated(params: MeshUpdatedParams): void;
}

export interface StoreListen {
  resync(fn: () => any): void;
  move(fn: (params: MoveParams) => any): void;
  playEffect(fn: (params: PlayEffectParams) => any): void;
  meshUpdated(fn: (params: MeshUpdatedParams) => any): void;
}

export interface StoreEventParams { }

export interface MoveParams extends StoreEventParams {
  object: GameObject;
  to: Position;
  from: Position;
}

export interface PlayEffectParams extends ZC.PlayEffectParams {

}

export interface MeshUpdatedParams extends StoreEventParams {
  id: string;
  vertices: any[];
  faces: any[];
}
