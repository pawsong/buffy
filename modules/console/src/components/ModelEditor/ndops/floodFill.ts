import * as ndarray from 'ndarray';

import { Position } from '../types';

export default function floodFill(
  shape: Position, dest: ndarray.Ndarray, getter: (x: number, y: number, z: number) => any, value: number, seed: Position
): boolean {
  // // For debugging
  // console.log('floodfill start!');
  // const then = performance.now();

  const hiX = shape[0] - 1;
  const hiY = shape[1] - 1;
  const hiZ = shape[2] - 1;

  if (
       seed[0] < 0 || seed[0] > hiX
    || seed[1] < 0 || seed[1] > hiY
    || seed[2] < 0 || seed[2] > hiZ
  ) {
    return false;
  }

  const startNode = getter(seed[0], seed[1], seed[2]);
  if (startNode === undefined) return false;

  const visits = ndarray(new Int8Array(shape[0] * shape[1] * shape[2]), shape);

  let hit = false;

  const stack = [];
  stack.push(seed);

  while (stack.length > 0) {
    const getArgs = stack.pop();

    if (visits.get(getArgs[0], getArgs[1], getArgs[2])) continue;
    visits.set(getArgs[0], getArgs[1], getArgs[2], 1);

    if (getter(getArgs[0], getArgs[1], getArgs[2]) === startNode) {
      dest.set(getArgs[0], getArgs[1], getArgs[2], value);
      hit = true;

      // [ - 1,   0,   0 ]
      if (getArgs[0] > 0) {
        const nextArgs = getArgs.slice(0);
        nextArgs[0]--;
        stack.push(nextArgs);
      }

      // [   0, - 1,   0 ]
      if (getArgs[1] > 0) {
        const nextArgs = getArgs.slice(0);
        nextArgs[1]--;
        stack.push(nextArgs);
      }

      // [   0,   0, - 1 ]
      if (getArgs[2] > 0) {
        const nextArgs = getArgs.slice(0);
        nextArgs[2]--;
        stack.push(nextArgs);
      }

      // [   1,   0,   0 ]
      if (getArgs[0] < hiX) {
        const nextArgs = getArgs.slice(0);
        nextArgs[0]++;
        stack.push(nextArgs);
      }

      // [   0,   1,   0 ]
      if (getArgs[1] < hiY) {
        const nextArgs = getArgs.slice(0);
        nextArgs[1]++;
        stack.push(nextArgs);
      }

      // [   0,   0,   1 ]
      if (getArgs[2] < hiZ) {
        const nextArgs = getArgs.slice(0);
        nextArgs[2]++;
        stack.push(nextArgs);
      }
    }
  }

  // // For debugging
  // console.log('elapsed time: ', performance.now() - then);

  return hit;
};
