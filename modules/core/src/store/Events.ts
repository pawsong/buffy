import GameObject from '../classes/GameObject';
import { Position } from '../classes/GameObject';
import { EventSubscription } from 'fbemitter';
import * as ZC from '../packet/ZC';

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
  resync(fn: () => any): EventSubscription;
  move(fn: (params: MoveParams) => any): EventSubscription;
  playEffect(fn: (params: PlayEffectParams) => any): EventSubscription;
  meshUpdated(fn: (params: MeshUpdatedParams) => any): EventSubscription;
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
  object: GameObject;
}