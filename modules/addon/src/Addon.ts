import StateLayer from './StateLayer';

export interface UninstallAddon {
  (): void;
}

export interface InstallAddon {
  (element: HTMLElement, stateLayer: StateLayer): UninstallAddon;
}

interface Addon {
  name: string,
  install: InstallAddon;
}

export default Addon;
