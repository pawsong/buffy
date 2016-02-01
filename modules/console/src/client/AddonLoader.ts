import Addon from '@pasta/core/lib/Addon';

// Bind addons
let _addon: Addon = null;

Object.defineProperty(window, '__ADDON_REGISTER__', {
  enumerable: false,
  configurable: false,
  writable: false,
  value: (addon: Addon) => { _addon = addon; },
});

export function popAddon(): Addon {
  const addon = _addon;
  _addon = null;
  return addon;
}
