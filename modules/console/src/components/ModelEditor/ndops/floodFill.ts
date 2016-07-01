import { Ndarray } from 'ndarray';
const invariant = require('fbjs/lib/invariant');

import { Position } from '../types';

interface Getter {
  (x: number, y: number, z: number): number;
}

function floodFill(dest: Ndarray, value: number, seed: Position, getter?: Getter): boolean {
  // // For debugging
  // console.log('floodfill start!');
  // const then = performance.now();

  const finalGetter = getter || ((x, y, z) => dest.get(x, y, z));

  const hx = dest.shape[0] - 1;
  const hy = dest.shape[1] - 1;
  const hz = dest.shape[2] - 1;

  if (
       seed[0] < 0 || seed[0] > hx
    || seed[1] < 0 || seed[1] > hy
    || seed[2] < 0 || seed[2] > hz
  ) {
    return false;
  }

  const startNode = finalGetter(seed[0], seed[1], seed[2]);
  if (startNode === undefined || startNode === value) return false;

  let hit = false;
  let inScanLine;

  const stack = [];
  stack.push(seed);

  while (stack.length > 0) {
    const [x, y, z] = stack.pop();

    if (finalGetter(x, y, z) !== startNode) continue;

    hit = true;

    let x1 = x;
    let x2 = x;

    while (x1 > 0 && finalGetter(x1 - 1, y, z) === startNode) x1--;
    while (x2 < hx && finalGetter(x2 + 1, y, z) === startNode) x2++;

		for (let i = x1; i <= x2; i++) dest.set(i, y, z, value);

    // find scan-lines above the current one
    if (y > 0) {
      inScanLine = false;
      for (let i = x1; i <= x2; i++) {
        const val = finalGetter(i, y - 1, z);
        if (!inScanLine && val === startNode) {
          stack.push([i, y - 1, z]);
          inScanLine = true;
        } else if (inScanLine && val !== startNode) {
          inScanLine = false;
        }
      }
    }

    if (y < hy) {
      inScanLine = false;
      for (let i = x1; i <= x2; i++) {
        const val = finalGetter(i, y + 1, z);
        if (!inScanLine && val === startNode) {
          stack.push([i, y + 1, z]);
          inScanLine = true;
        } else if (inScanLine && val !== startNode) {
          inScanLine = false;
        }
      }
    }

    if (z > 0) {
      inScanLine = false;
      for (let i = x1; i <= x2; i++) {
        const val = finalGetter(i, y, z - 1);
        if (!inScanLine && val === startNode) {
          stack.push([i, y, z - 1]);
          inScanLine = true;
        } else if (inScanLine && val != startNode) {
          inScanLine = false;
        }
      }
    }

    if (z < hz) {
      inScanLine = false;
      for (let i = x1; i <= x2; i++) {
        const val = finalGetter(i, y, z + 1);
        if (!inScanLine && val === startNode) {
          stack.push([i, y, z + 1]);
          inScanLine = true;
        } else if (inScanLine && val !== startNode) {
          inScanLine = false;
        }
      }
    }
  }

  // // For debugging
  // console.log('elapsed time: ', performance.now() - then);

  return hit;
};

export default floodFill;
