import { defineAsync } from '../base';

/**
 * boom block
 */

export default defineAsync(({
  stateLayer,
  playerId,
}) => () => {
  const object = stateLayer.store.findObject(playerId);
  const { id, position } = object;
  return stateLayer.rpc.playEffect({
    objectId: id,
    x: position.x,
    z: position.z,
    duration: 2,
  });
});
