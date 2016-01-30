import Addon from '@pasta/core/lib/Addon';
import { InstallAddon } from '@pasta/core/lib/Addon';
import Context from '@pasta/core/lib/Context';
import { ContextInterface } from '@pasta/core/lib/Context';

/*
 * DO NOT LOAD ANY OTHER MODULES HERE
 *
 * Modules must be loaded after @pasta/core Context is ready.
 */

Addon.register({
  name: NPM_PACKAGE_NAME,
  install: (container, stateLayer) => {
    const _Context: ContextInterface = {
      stateLayer,
      log: msg => console.log(msg),
    };
    Object.keys(_Context).forEach(key => Context[key] = _Context[key]);

    const install: InstallAddon = require('./install').default;
    return install(container, stateLayer);
  }
});
