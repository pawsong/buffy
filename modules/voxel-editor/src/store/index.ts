import { createStore, bindActionCreators } from 'redux';
import objectAssign = require('object-assign');
import reducers from '../reducers';
import * as VoxelActions from '../actions/voxel';
import * as SpriteActions from '../actions/sprite';
import * as ColorActions from '../actions/color';

const store = createStore(reducers);

export const actions = bindActionCreators(objectAssign({}, 
  VoxelActions,
  SpriteActions,
  ColorActions
), store.dispatch);

export function observeStore(select, onChange) {
  let currentState;

  function handleChange() {
    let nextState = select(store.getState());
    if (nextState !== currentState) {
      currentState = nextState;
      onChange(currentState);
    }
  }

  let unsubscribe = store.subscribe(handleChange);
  handleChange();
  return unsubscribe;
}

export default store;
