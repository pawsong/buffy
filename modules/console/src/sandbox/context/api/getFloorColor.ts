import * as Promise from 'bluebird';

import Vector3 from '@pasta/core/lib/classes/Vector3';
import Quaternion from '@pasta/core/lib/classes/Quaternion';
import { defineSync } from '../base';

/**
 * boom block
 */

const q = new Quaternion();
const u = new Vector3({ x: 1, y: 0, z: 0 });

export default defineSync(({
  stateLayer,
  playerId: playerId,
  interpreter,
}) => (x: number, z: number) => {
  const object = stateLayer.store.findObject(playerId);
  q.setFromUnitVectors(u, object.direction);

  const v = new Vector3({ x, y: 0, z }).applyQuaternion(q);

  const roundedX = Math.round(object.position.x + v.x);
  const roundedZ = Math.round(object.position.z + v.z);

  const len = object.zone.terrains.length;
  for (let i = 0; i < len; ++i) {
    const terrain = object.zone.terrains[i];
    if (terrain.position.x === roundedX && terrain.position.z === roundedZ) {
      return interpreter.createPrimitive(terrain.color);
    }
  }
  return interpreter.createPrimitive(-1);
});
