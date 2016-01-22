import Addon from './Addon';

interface AddonRegistry {
  [index: string]: Addon;
}

declare const global;
declare let __a;
if (typeof __a === 'undefined') {
  (typeof window !== 'undefined' ? window : global).__a = {};
}
const addonRegistry: AddonRegistry = __a;

export function load(addonName: string) {
  if (!addonRegistry[addonName]) {
    throw new Error(`addon ${addonName} is not registered`);
  }
  return addonRegistry[addonName];
}

export function register(addon: Addon) {
  if (addonRegistry[addon.name]) {
    throw new Error(`addon ${addon.name} is already registered`);
  }
  addonRegistry[addon.name] = addon;
}
