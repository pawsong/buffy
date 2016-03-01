import StateLayer from './StateLayer';

export interface AddonInst {
  destroy(): void;
  emit(event: string, data?: Object): void;
}

export interface InstallAddon {
  (element: HTMLElement, stateLayer: StateLayer): AddonInst;
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
