/*
 * Context object must be filled with instances
 * before any other core modules are loaded.
 */

import StateLayer from './StateLayer';

export interface ContextInterface {
  stateLayer: StateLayer;
  log: Function;
}

const Context: ContextInterface = {} as ContextInterface;
export default Context;
