import StateLayer from './StateLayer';

interface Addon {
  (element: HTMLElement, stateLayer: StateLayer): void;
}

export default Addon;
