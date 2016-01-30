import Addon from '@pasta/addon/lib/Addon';
import { InstallAddon } from '@pasta/addon/lib/Addon';
import Ctx from '@pasta/core/lib/Context';

/*
 * DO NOT LOAD ANY OTHER MODULES HERE
 *
 * Modules must be loaded after @pasta/core Context is ready.
 */

Addon.register({
  name: NPM_PACKAGE_NAME,
  install: (container, stateLayer) => {
    Ctx.stateLayer = stateLayer as any;
    Ctx.log = (msg) => console.log(msg);

    const install: InstallAddon = require('./install').default;
    return install(container, stateLayer);
  }
});
