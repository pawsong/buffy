import { EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';
import StateStore from '@pasta/core/lib/StateStore';
import { StoreListen } from '@pasta/core/lib/store/Events';

export interface ZoneViewState {
  playerId: string;
}

export interface GetZoneViewState {
  (): ZoneViewState;
}

interface StoreHandlerParams<T> {
  store: StateStore;
  canvas: T;
  getState: GetZoneViewState;
}

export interface StoreHandler<T> {
  (params: StoreHandlerParams<T>): EventSubscription;
}
