import { createStore, bindActionCreators } from 'redux';
import reducers from '../reducers';
import * as VoxelActions from '../actions/voxel';

const store = createStore(reducers);

export const actions = bindActionCreators(VoxelActions, store.dispatch);

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
