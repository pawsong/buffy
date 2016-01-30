import StateLayer from './StateLayer';

export interface UninstallAddon {
  (): void;
}

export interface InstallAddon {
  (element: HTMLElement, stateLayer: StateLayer): UninstallAddon;
}

declare const __ADDON_REGISTER__;
class Addon {
  static register(addon: Addon) {
    __ADDON_REGISTER__(addon);
  }
  name: string;
  install: InstallAddon;
}

export default Addon;
