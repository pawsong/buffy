import { Store } from 'redux';
import { State } from '../reducers';

interface Select<T> {
  (state: State): T;
}

interface onChange<T> {
  (state: T): any;
}

interface StoreSubscription {
  remove: () => any;
}

export default function observeStore<T>(store: Store, select: Select<T>, onChange: onChange<T>): StoreSubscription {
  let currentState;

  function handleChange() {
    let nextState = select(store.getState());
    if (nextState !== currentState) {
      currentState = nextState;
      onChange(currentState);
    }
  }

  let unsubscribe = store.subscribe(handleChange) as any;
  handleChange();
  return {
    remove: unsubscribe,
  };
}
