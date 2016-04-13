import { defineAsync } from '../base';

/**
 * boom block
 */

export default defineAsync(({
  stateLayer,
}) => () => {
  const { position } = stateLayer.store.getPlayer();
  return stateLayer.rpc.playEffect({
    x: position.x,
    z: position.z,
    duration: 2,
  });
});
