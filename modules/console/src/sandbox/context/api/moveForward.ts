import * as Promise from 'bluebird';
import { defineAsync } from '../base';

/**
 * boom block
 */

export default defineAsync(({
  stateLayer,
}) => (distance: number) => {
  const obj = stateLayer.store.getPlayer();
  const newPos = obj.position.clone().add(obj.direction.clone().multiplyScalar(distance));
  return stateLayer.rpc.move({
    id: obj.id,
    x: newPos.x,
    z: newPos.z,
  }).then(() => new Promise(resolve => {
    const token = obj.onStop(() => {
      // TODO: Check if interrupted or finished
      token.remove();
      resolve();
    });
  }));
});
