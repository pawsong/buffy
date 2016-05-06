import * as Promise from 'bluebird';
import { defineAsync } from '../base';

/**
 * boom block
 */

export default defineAsync(({
  stateLayer,
  playerId,
}) => (distance: number) => {
  const object = stateLayer.store.findObject(playerId);
  const newPos = object.position.clone().add(object.direction.clone().multiplyScalar(distance));
  return stateLayer.rpc.move({
    id: object.id,
    x: newPos.x,
    z: newPos.z,
  }).then(() => new Promise(resolve => {
    const token = object.onStop(() => {
      // TODO: Check if interrupted or finished
      token.remove();
      resolve();
    });
  }));
});
