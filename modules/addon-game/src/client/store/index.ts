import { createStore } from 'redux';
import reducers from '../reducers';

const store = createStore(reducers);

export function observeStore(store, select, onChange) {
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
  return {
    remove: unsubscribe,
  };
}

export default store;
