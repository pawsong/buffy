import StateLayer from '@pasta/core/lib/StateLayer';

import { Action } from './';

export const REQUEST_ZONE_CONNECT: 'zone/REQUEST_ZONE_CONNECT' = 'zone/REQUEST_ZONE_CONNECT';
export interface RequestZoneConnectAction extends Action<typeof REQUEST_ZONE_CONNECT> {
}
export function requestZoneConnect(): RequestZoneConnectAction {
  return {
    type: REQUEST_ZONE_CONNECT,
  };
}

export const ZONE_CONNECT_SUCCEEDED: 'zone/ZONE_CONNECT_SUCCEEDED' = 'zone/ZONE_CONNECT_SUCCEEDED';
export interface ZoneConnectSucceededAction extends Action<typeof ZONE_CONNECT_SUCCEEDED> {
  stateLayer: StateLayer;
}
