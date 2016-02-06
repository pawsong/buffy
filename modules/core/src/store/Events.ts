import GameObject from '../classes/GameObject';
import { Position } from '../classes/GameObject';
import { EventSubscription } from 'fbemitter';
import * as ZC from '../packet/ZC';

export const StoreEvents = [
  'resync',
  'objectAdded',
  'objectRemoved',
  'move',
  'playEffect',
  'meshUpdated',
];

export interface StoreEmit {
  resync(): void;
  objectAdded(params: ObjectAddedParams): void;
  objectRemoved(params: ObjectRemovedParams): void;
  move(params: MoveParams): void;
  playEffect(params: PlayEffectParams): void;
  meshUpdated(params: MeshUpdatedParams): void;
}

export interface StoreListen {
  resync(fn: () => any): EventSubscription;
  objectAdded(fn: (params: ObjectAddedParams) => any): EventSubscription;
  objectRemoved(fn: (params: ObjectRemovedParams) => any): EventSubscription;
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

export interface ObjectAddedParams extends StoreEventParams {
  object: GameObject;
}

export interface ObjectRemovedParams extends StoreEventParams {
  id: string;
}

export interface PlayEffectParams extends ZC.PlayEffectParams {

}

export interface MeshUpdatedParams extends StoreEventParams {
  object: GameObject;
}
