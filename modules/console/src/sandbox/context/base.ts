import * as Promise from 'bluebird';
import StateLayer from '@pasta/core/lib/StateLayer';

export interface ApiContext {
  stateLayer: StateLayer;
  playerId: string;
  interpreter: any;
}

interface ApiBase<T> {
  (context: ApiContext): (...args) => T;
}

// TODO: Define types for sync
type ApiSync = ApiBase<any>;
type ApiAsync = ApiBase<Promise<any>>;

export function defineSync(api: ApiSync) {
  return { async: false, api };
}

export function defineAsync(api: ApiAsync) {
  return { async: true, api };
}
