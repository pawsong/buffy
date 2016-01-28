import * as addon from '@pasta/addon';
import { InstallAddon } from '@pasta/addon/lib/Addon';
import Ctx from '@pasta/core/lib/Context';

/*
 * DO NOT LOAD ANY OTHER MODULES HERE
 *
 * Modules must be loaded after @pasta/core Context is ready.
 */

addon.register({
  name: NPM_PACKAGE_NAME,
  install: (container, stateLayer) => {
    Ctx.stateLayer = stateLayer as any;
    Ctx.log = (msg) => console.log(msg);

    const install: InstallAddon = require('./install').default;
    return install(container, stateLayer);
  }
});
