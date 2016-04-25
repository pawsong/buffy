import { EventSubscription } from 'fbemitter';
import StateLayer from '@pasta/core/lib/StateLayer';
import { StoreListen } from '@pasta/core/lib/store/Events';

export interface StoreHandler<T> {
  (listen: StoreListen, view: T, stateLayer: StateLayer): EventSubscription;
}
