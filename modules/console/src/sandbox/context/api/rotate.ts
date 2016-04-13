import { defineAsync } from '../base';

/**
 * boom block
 */

export default defineAsync(({
  stateLayer,
}) => (angle: number) => {
  const obj = stateLayer.store.getPlayer();
  const newDirection = obj.direction.clone().applyAxisAngle({ x: 0, y: 1, z: 0 }, angle / 180 * Math.PI);
  return stateLayer.rpc.rotate({
    id: obj.id,
    direction: newDirection.serialize(),
  });
});
