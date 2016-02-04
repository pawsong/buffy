import * as $script from 'scriptjs';
import Addon from '@pasta/core/lib/Addon';

// Bind addons
let addonRegistry: {
  [index: string]: Addon;
} = {};

Object.defineProperty(window, '__ADDON_REGISTER__', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: (addon: Addon) => {
    addonRegistry[addon.name] = addon;
  },
});

export async function load(url, name) {
  await new Promise(resolve => $script(url, () => resolve()));
  return addonRegistry[name];
}
