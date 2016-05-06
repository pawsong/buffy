import { EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';
import { StoreListen } from '@pasta/core/lib/store/Events';

export interface ZoneViewState {
  playerId: string;
}

export interface GetZoneViewState {
  (): ZoneViewState;
}

export interface StoreHandler<T> {
  (listen: StoreListen, view: T, stateLayer: StateLayer, getState: GetZoneViewState): EventSubscription;
}
