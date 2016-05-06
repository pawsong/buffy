import { defineAsync } from '../base';

/**
 * boom block
 */

export default defineAsync(({
  stateLayer,
  playerId,
}) => (angle: number) => {
  const object = stateLayer.store.findObject(playerId);
  const newDirection = object.direction.clone().applyAxisAngle({ x: 0, y: 1, z: 0 }, angle / 180 * Math.PI);
  return stateLayer.rpc.rotate({
    id: object.id,
    direction: newDirection.serialize(),
  });
});
