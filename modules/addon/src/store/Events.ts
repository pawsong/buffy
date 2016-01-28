import GameObject from '@pasta/game-class/lib/GameObject';
import { Position } from '@pasta/game-class/lib/GameObject';
import { EventSubscription } from 'fbemitter';
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
