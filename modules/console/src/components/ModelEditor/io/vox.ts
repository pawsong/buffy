import * as ndarray from 'ndarray';

import {
  rgbToHex,
} from '../canvas/utils';

interface ImportResult {
  result?: ndarray.Ndarray;
  error?: string;
}

const defaultPalette = [ // default palette
  {r: 255, g: 255, b: 255, a: 255, t: 0, s: 0}, {r: 255, g: 255, b: 204, a: 255, t: 0, s: 0}, {r: 255, g: 255, b: 153, a: 255, t: 0, s: 0},
  {r: 255, g: 255, b: 102, a: 255, t: 0, s: 0}, {r: 255, g: 255, b:  51, a: 255, t: 0, s: 0}, {r: 255, g: 255, b:   0, a: 255, t: 0, s: 0},
  {r: 255, g: 204, b: 255, a: 255, t: 0, s: 0}, {r: 255, g: 204, b: 204, a: 255, t: 0, s: 0}, {r: 255, g: 204, b: 153, a: 255, t: 0, s: 0},
  {r: 255, g: 204, b: 102, a: 255, t: 0, s: 0}, {r: 255, g: 204, b:  51, a: 255, t: 0, s: 0}, {r: 255, g: 204, b:   0, a: 255, t: 0, s: 0},
  {r: 255, g: 153, b: 255, a: 255, t: 0, s: 0}, {r: 255, g: 153, b: 204, a: 255, t: 0, s: 0}, {r: 255, g: 153, b: 153, a: 255, t: 0, s: 0},
  {r: 255, g: 153, b: 102, a: 255, t: 0, s: 0}, {r: 255, g: 153, b:  51, a: 255, t: 0, s: 0}, {r: 255, g: 153, b:   0, a: 255, t: 0, s: 0},
  {r: 255, g: 102, b: 255, a: 255, t: 0, s: 0}, {r: 255, g: 102, b: 204, a: 255, t: 0, s: 0}, {r: 255, g: 102, b: 153, a: 255, t: 0, s: 0},
  {r: 255, g: 102, b: 102, a: 255, t: 0, s: 0}, {r: 255, g: 102, b:  51, a: 255, t: 0, s: 0}, {r: 255, g: 102, b:   0, a: 255, t: 0, s: 0},
  {r: 255, g:  51, b: 255, a: 255, t: 0, s: 0}, {r: 255, g:  51, b: 204, a: 255, t: 0, s: 0}, {r: 255, g:  51, b: 153, a: 255, t: 0, s: 0},
  {r: 255, g:  51, b: 102, a: 255, t: 0, s: 0}, {r: 255, g:  51, b:  51, a: 255, t: 0, s: 0}, {r: 255, g:  51, b:   0, a: 255, t: 0, s: 0},
  {r: 255, g:   0, b: 255, a: 250, t: 7, s: 7}, {r: 255, g:   0, b: 204, a: 255, t: 0, s: 0}, {r: 255, g:   0, b: 153, a: 255, t: 0, s: 0},
  {r: 255, g:   0, b: 102, a: 255, t: 0, s: 0}, {r: 255, g:   0, b:  51, a: 255, t: 0, s: 0}, {r: 255, g:   0, b:   0, a: 255, t: 0, s: 0},
  {r: 204, g: 255, b: 255, a: 255, t: 0, s: 0}, {r: 204, g: 255, b: 204, a: 255, t: 0, s: 0}, {r: 204, g: 255, b: 153, a: 255, t: 0, s: 0},
  {r: 204, g: 255, b: 102, a: 255, t: 0, s: 0}, {r: 204, g: 255, b:  51, a: 255, t: 0, s: 0}, {r: 204, g: 255, b:   0, a: 255, t: 0, s: 0},
  {r: 204, g: 204, b: 255, a: 255, t: 0, s: 0}, {r: 204, g: 204, b: 204, a: 255, t: 0, s: 0}, {r: 204, g: 204, b: 153, a: 255, t: 0, s: 0},
  {r: 204, g: 204, b: 102, a: 255, t: 0, s: 0}, {r: 204, g: 204, b:  51, a: 255, t: 0, s: 0}, {r: 204, g: 204, b:   0, a: 255, t: 0, s: 0},
  {r: 204, g: 153, b: 255, a: 255, t: 0, s: 0}, {r: 204, g: 153, b: 204, a: 255, t: 0, s: 0}, {r: 204, g: 153, b: 153, a: 255, t: 0, s: 0},
  {r: 204, g: 153, b: 102, a: 255, t: 0, s: 0}, {r: 204, g: 153, b:  51, a: 255, t: 0, s: 0}, {r: 204, g: 153, b:   0, a: 255, t: 0, s: 0},
  {r: 204, g: 102, b: 255, a: 255, t: 0, s: 0}, {r: 204, g: 102, b: 204, a: 255, t: 0, s: 0}, {r: 204, g: 102, b: 153, a: 255, t: 0, s: 0},
  {r: 204, g: 102, b: 102, a: 255, t: 0, s: 0}, {r: 204, g: 102, b:  51, a: 255, t: 0, s: 0}, {r: 204, g: 102, b:   0, a: 255, t: 0, s: 0},
  {r: 204, g:  51, b: 255, a: 255, t: 0, s: 0}, {r: 204, g:  51, b: 204, a: 255, t: 0, s: 0}, {r: 204, g:  51, b: 153, a: 255, t: 0, s: 0},
  {r: 204, g:  51, b: 102, a: 255, t: 0, s: 0}, {r: 204, g:  51, b:  51, a: 255, t: 0, s: 0}, {r: 204, g:  51, b:   0, a: 255, t: 0, s: 0},
  {r: 204, g:   0, b: 255, a: 255, t: 0, s: 0}, {r: 204, g:   0, b: 204, a: 255, t: 0, s: 0}, {r: 204, g:   0, b: 153, a: 255, t: 0, s: 0},
  {r: 204, g:   0, b: 102, a: 255, t: 0, s: 0}, {r: 204, g:   0, b:  51, a: 255, t: 0, s: 0}, {r: 204, g:   0, b:   0, a: 255, t: 0, s: 0},
  {r: 153, g: 255, b: 255, a: 255, t: 0, s: 0}, {r: 153, g: 255, b: 204, a: 255, t: 0, s: 0}, {r: 153, g: 255, b: 153, a: 255, t: 0, s: 0},
  {r: 153, g: 255, b: 102, a: 255, t: 0, s: 0}, {r: 153, g: 255, b:  51, a: 255, t: 0, s: 0}, {r: 153, g: 255, b:   0, a: 255, t: 0, s: 0},
  {r: 153, g: 204, b: 255, a: 255, t: 0, s: 0}, {r: 153, g: 204, b: 204, a: 255, t: 0, s: 0}, {r: 153, g: 204, b: 153, a: 255, t: 0, s: 0},
  {r: 153, g: 204, b: 102, a: 255, t: 0, s: 0}, {r: 153, g: 204, b:  51, a: 255, t: 0, s: 0}, {r: 153, g: 204, b:   0, a: 255, t: 0, s: 0},
  {r: 153, g: 153, b: 255, a: 255, t: 0, s: 0}, {r: 153, g: 153, b: 204, a: 255, t: 0, s: 0}, {r: 153, g: 153, b: 153, a: 255, t: 0, s: 0},
  {r: 153, g: 153, b: 102, a: 255, t: 0, s: 0}, {r: 153, g: 153, b:  51, a: 255, t: 0, s: 0}, {r: 153, g: 153, b:   0, a: 255, t: 0, s: 0},
  {r: 153, g: 102, b: 255, a: 255, t: 0, s: 0}, {r: 153, g: 102, b: 204, a: 255, t: 0, s: 0}, {r: 153, g: 102, b: 153, a: 255, t: 0, s: 0},
  {r: 153, g: 102, b: 102, a: 255, t: 0, s: 0}, {r: 153, g: 102, b:  51, a: 255, t: 0, s: 0}, {r: 153, g: 102, b:   0, a: 255, t: 0, s: 0},
  {r: 153, g:  51, b: 255, a: 255, t: 0, s: 0}, {r: 153, g:  51, b: 204, a: 255, t: 0, s: 0}, {r: 153, g:  51, b: 153, a: 255, t: 0, s: 0},
  {r: 153, g:  51, b: 102, a: 255, t: 0, s: 0}, {r: 153, g:  51, b:  51, a: 255, t: 0, s: 0}, {r: 153, g:  51, b:   0, a: 255, t: 0, s: 0},
  {r: 153, g:   0, b: 255, a: 255, t: 0, s: 0}, {r: 153, g:   0, b: 204, a: 255, t: 0, s: 0}, {r: 153, g:   0, b: 153, a: 255, t: 0, s: 0},
  {r: 153, g:   0, b: 102, a: 255, t: 0, s: 0}, {r: 153, g:   0, b:  51, a: 255, t: 0, s: 0}, {r: 153, g:   0, b:   0, a: 255, t: 0, s: 0},
  {r: 102, g: 255, b: 255, a: 255, t: 0, s: 0}, {r: 102, g: 255, b: 204, a: 255, t: 0, s: 0}, {r: 102, g: 255, b: 153, a: 255, t: 0, s: 0},
  {r: 102, g: 255, b: 102, a: 255, t: 0, s: 0}, {r: 102, g: 255, b:  51, a: 255, t: 0, s: 0}, {r: 102, g: 255, b:   0, a: 255, t: 0, s: 0},
  {r: 102, g: 204, b: 255, a: 255, t: 0, s: 0}, {r: 102, g: 204, b: 204, a: 255, t: 0, s: 0}, {r: 102, g: 204, b: 153, a: 255, t: 0, s: 0},
  {r: 102, g: 204, b: 102, a: 255, t: 0, s: 0}, {r: 102, g: 204, b:  51, a: 255, t: 0, s: 0}, {r: 102, g: 204, b:   0, a: 255, t: 0, s: 0},
  {r: 102, g: 153, b: 255, a: 255, t: 0, s: 0}, {r: 102, g: 153, b: 204, a: 255, t: 0, s: 0}, {r: 102, g: 153, b: 153, a: 255, t: 0, s: 0},
  {r: 102, g: 153, b: 102, a: 255, t: 0, s: 0}, {r: 102, g: 153, b:  51, a: 255, t: 0, s: 0}, {r: 102, g: 153, b:   0, a: 255, t: 0, s: 0},
  {r: 102, g: 102, b: 255, a: 255, t: 0, s: 0}, {r: 102, g: 102, b: 204, a: 255, t: 0, s: 0}, {r: 102, g: 102, b: 153, a: 255, t: 0, s: 0},
  {r: 102, g: 102, b: 102, a: 255, t: 0, s: 0}, {r: 102, g: 102, b:  51, a: 255, t: 0, s: 0}, {r: 102, g: 102, b:   0, a: 255, t: 0, s: 0},
  {r: 102, g:  51, b: 255, a: 255, t: 0, s: 0}, {r: 102, g:  51, b: 204, a: 255, t: 0, s: 0}, {r: 102, g:  51, b: 153, a: 255, t: 0, s: 0},
  {r: 102, g:  51, b: 102, a: 255, t: 0, s: 0}, {r: 102, g:  51, b:  51, a: 255, t: 0, s: 0}, {r: 102, g:  51, b:   0, a: 255, t: 0, s: 0},
  {r: 102, g:   0, b: 255, a: 255, t: 0, s: 0}, {r: 102, g:   0, b: 204, a: 255, t: 0, s: 0}, {r: 102, g:   0, b: 153, a: 255, t: 0, s: 0},
  {r: 102, g:   0, b: 102, a: 255, t: 0, s: 0}, {r: 102, g:   0, b:  51, a: 255, t: 0, s: 0}, {r: 102, g:   0, b:   0, a: 255, t: 0, s: 0},
  {r:  51, g: 255, b: 255, a: 255, t: 0, s: 0}, {r:  51, g: 255, b: 204, a: 255, t: 0, s: 0}, {r:  51, g: 255, b: 153, a: 255, t: 0, s: 0},
  {r:  51, g: 255, b: 102, a: 255, t: 0, s: 0}, {r:  51, g: 255, b:  51, a: 255, t: 0, s: 0}, {r:  51, g: 255, b:   0, a: 255, t: 0, s: 0},
  {r:  51, g: 204, b: 255, a: 255, t: 0, s: 0}, {r:  51, g: 204, b: 204, a: 255, t: 0, s: 0}, {r:  51, g: 204, b: 153, a: 255, t: 0, s: 0},
  {r:  51, g: 204, b: 102, a: 255, t: 0, s: 0}, {r:  51, g: 204, b:  51, a: 255, t: 0, s: 0}, {r:  51, g: 204, b:   0, a: 255, t: 0, s: 0},
  {r:  51, g: 153, b: 255, a: 255, t: 0, s: 0}, {r:  51, g: 153, b: 204, a: 255, t: 0, s: 0}, {r:  51, g: 153, b: 153, a: 255, t: 0, s: 0},
  {r:  51, g: 153, b: 102, a: 255, t: 0, s: 0}, {r:  51, g: 153, b:  51, a: 255, t: 0, s: 0}, {r:  51, g: 153, b:   0, a: 255, t: 0, s: 0},
  {r:  51, g: 102, b: 255, a: 255, t: 0, s: 0}, {r:  51, g: 102, b: 204, a: 255, t: 0, s: 0}, {r:  51, g: 102, b: 153, a: 255, t: 0, s: 0},
  {r:  51, g: 102, b: 102, a: 255, t: 0, s: 0}, {r:  51, g: 102, b:  51, a: 255, t: 0, s: 0}, {r:  51, g: 102, b:   0, a: 255, t: 0, s: 0},
  {r:  51, g:  51, b: 255, a: 255, t: 0, s: 0}, {r:  51, g:  51, b: 204, a: 255, t: 0, s: 0}, {r:  51, g:  51, b: 153, a: 255, t: 0, s: 0},
  {r:  51, g:  51, b: 102, a: 255, t: 0, s: 0}, {r:  51, g:  51, b:  51, a: 255, t: 0, s: 0}, {r:  51, g:  51, b:   0, a: 255, t: 0, s: 0},
  {r:  51, g:   0, b: 255, a: 255, t: 0, s: 0}, {r:  51, g:   0, b: 204, a: 255, t: 0, s: 0}, {r:  51, g:   0, b: 153, a: 255, t: 0, s: 0},
  {r:  51, g:   0, b: 102, a: 255, t: 0, s: 0}, {r:  51, g:   0, b:  51, a: 255, t: 0, s: 0}, {r:  51, g:   0, b:   0, a: 255, t: 0, s: 0},
  {r:   0, g: 255, b: 255, a: 255, t: 0, s: 0}, {r:   0, g: 255, b: 204, a: 255, t: 0, s: 0}, {r:   0, g: 255, b: 153, a: 255, t: 0, s: 0},
  {r:   0, g: 255, b: 102, a: 255, t: 0, s: 0}, {r:   0, g: 255, b:  51, a: 255, t: 0, s: 0}, {r:   0, g: 255, b:   0, a: 255, t: 0, s: 0},
  {r:   0, g: 204, b: 255, a: 255, t: 0, s: 0}, {r:   0, g: 204, b: 204, a: 255, t: 0, s: 0}, {r:   0, g: 204, b: 153, a: 255, t: 0, s: 0},
  {r:   0, g: 204, b: 102, a: 255, t: 0, s: 0}, {r:   0, g: 204, b:  51, a: 255, t: 0, s: 0}, {r:   0, g: 204, b:   0, a: 255, t: 0, s: 0},
  {r:   0, g: 153, b: 255, a: 255, t: 0, s: 0}, {r:   0, g: 153, b: 204, a: 255, t: 0, s: 0}, {r:   0, g: 153, b: 153, a: 255, t: 0, s: 0},
  {r:   0, g: 153, b: 102, a: 255, t: 0, s: 0}, {r:   0, g: 153, b:  51, a: 255, t: 0, s: 0}, {r:   0, g: 153, b:   0, a: 255, t: 0, s: 0},
  {r:   0, g: 102, b: 255, a: 255, t: 0, s: 0}, {r:   0, g: 102, b: 204, a: 255, t: 0, s: 0}, {r:   0, g: 102, b: 153, a: 255, t: 0, s: 0},
  {r:   0, g: 102, b: 102, a: 255, t: 0, s: 0}, {r:   0, g: 102, b:  51, a: 255, t: 0, s: 0}, {r:   0, g: 102, b:   0, a: 255, t: 0, s: 0},
  {r:   0, g:  51, b: 255, a: 255, t: 0, s: 0}, {r:   0, g:  51, b: 204, a: 255, t: 0, s: 0}, {r:   0, g:  51, b: 153, a: 255, t: 0, s: 0},
  {r:   0, g:  51, b: 102, a: 255, t: 0, s: 0}, {r:   0, g:  51, b:  51, a: 255, t: 0, s: 0}, {r:   0, g:  51, b:   0, a: 255, t: 0, s: 0},
  {r:   0, g:   0, b: 255, a: 255, t: 0, s: 0}, {r:   0, g:   0, b: 204, a: 255, t: 0, s: 0}, {r:   0, g:   0, b: 153, a: 255, t: 0, s: 0},
  {r:   0, g:   0, b: 102, a: 255, t: 0, s: 0}, {r:   0, g:   0, b:  51, a: 255, t: 0, s: 0}, {r: 238, g:   0, b:   0, a: 255, t: 0, s: 0},
  {r: 221, g:   0, b:   0, a: 255, t: 0, s: 0}, {r: 187, g:   0, b:   0, a: 255, t: 0, s: 0}, {r: 170, g:   0, b:   0, a: 255, t: 0, s: 0},
  {r: 136, g:   0, b:   0, a: 255, t: 0, s: 0}, {r: 119, g:   0, b:   0, a: 255, t: 0, s: 0}, {r:  85, g:   0, b:   0, a: 255, t: 0, s: 0},
  {r:  68, g:   0, b:   0, a: 255, t: 0, s: 0}, {r:  34, g:   0, b:   0, a: 255, t: 0, s: 0}, {r:  17, g:   0, b:   0, a: 255, t: 0, s: 0},
  {r:   0, g: 238, b:   0, a: 255, t: 0, s: 0}, {r:   0, g: 221, b:   0, a: 255, t: 0, s: 0}, {r:   0, g: 187, b:   0, a: 255, t: 0, s: 0},
  {r:   0, g: 170, b:   0, a: 255, t: 0, s: 0}, {r:   0, g: 136, b:   0, a: 255, t: 0, s: 0}, {r:   0, g: 119, b:   0, a: 255, t: 0, s: 0},
  {r:   0, g:  85, b:   0, a: 255, t: 0, s: 0}, {r:   0, g:  68, b:   0, a: 255, t: 0, s: 0}, {r:   0, g:  34, b:   0, a: 255, t: 0, s: 0},
  {r:   0, g:  17, b:   0, a: 255, t: 0, s: 0}, {r:   0, g:   0, b: 238, a: 255, t: 0, s: 0}, {r:   0, g:   0, b: 221, a: 255, t: 0, s: 0},
  {r:   0, g:   0, b: 187, a: 255, t: 0, s: 0}, {r:   0, g:   0, b: 170, a: 255, t: 0, s: 0}, {r:   0, g:   0, b: 136, a: 255, t: 0, s: 0},
  {r:   0, g:   0, b: 119, a: 255, t: 0, s: 0}, {r:   0, g:   0, b:  85, a: 255, t: 0, s: 0}, {r:   0, g:   0, b:  68, a: 255, t: 0, s: 0},
  {r:   0, g:   0, b:  34, a: 255, t: 0, s: 0}, {r:   0, g:   0, b:  17, a: 255, t: 0, s: 0}, {r: 238, g: 238, b: 238, a: 255, t: 0, s: 0},
  {r: 221, g: 221, b: 221, a: 255, t: 0, s: 0}, {r: 187, g: 187, b: 187, a: 255, t: 0, s: 0}, {r: 170, g: 170, b: 170, a: 255, t: 0, s: 0},
  {r: 136, g: 136, b: 136, a: 255, t: 0, s: 0}, {r: 119, g: 119, b: 119, a: 255, t: 0, s: 0}, {r:  85, g:  85, b:  85, a: 255, t: 0, s: 0},
  {r:  68, g:  68, b:  68, a: 255, t: 0, s: 0}, {r:  34, g:  34, b:  34, a: 255, t: 0, s: 0}, {r:  17, g:  17, b:  17, a: 255, t: 0, s: 0}
];

function arrayBufferToString(buffer: ArrayBuffer, byteOffset, length) {
  return String.fromCharCode.apply(null, new Uint8Array(buffer, byteOffset, length));
}

export function importVoxFile(ab: ArrayBuffer): ImportResult {
  const data = new DataView(ab);

  console.log(ab);
  console.log(data);

  const meta = arrayBufferToString(ab, 0, 4);
  if (meta !== 'VOX ') {
    return { error: `meta: ${meta} (expected VOX )` };
  }

  const version = data.getUint32(4, true);
  if (version !== 150) {
    console.warn(`Expected version 150 but found version: ${version} (May result in errors)`);
  }

  const mainChunkId = arrayBufferToString(ab, 8, 4);
  if (mainChunkId !== 'MAIN') {
    return { error: 'Did not found main Chunk as expected' };
  }

  const mainChunkSize = data.getUint32(12, true);
  const mainChunkChildSize = data.getUint32(16, true);

  if (20 + mainChunkChildSize !== ab.byteLength) {
    console.warn('There should not be any bytes left');
  }

  let chunkPointer = 20 + mainChunkSize;
  let sizeBegin, sizeEnd, voxelBegin, voxelEnd, paletteBegin, paletteLength;
  sizeBegin = sizeEnd = voxelBegin = voxelEnd = paletteBegin = paletteLength = -1;

  while (chunkPointer < 20 + mainChunkSize + mainChunkChildSize) {
    const chunkId = arrayBufferToString(ab, chunkPointer, 4);
    let chunkSize = data.getUint32(chunkPointer + 4, true);
    let chunkChildSize = data.getUint32(chunkPointer + 8, true);

    switch (chunkId) {
      case 'SIZE':
        if (chunkSize !== 12) {
          console.warn("invalid length of size chunk");
        }
        sizeBegin = chunkPointer + 12;
        sizeEnd = sizeBegin + chunkSize;
        break;
      case 'XYZI':
        voxelBegin = chunkPointer + 12;
        voxelEnd = voxelBegin + chunkSize;
        break;
      case 'RGBA':
        paletteBegin = chunkPointer + 12;
        if (chunkSize !== 1024) {
          console.warn("invalid length of palette chunk");
        }
        paletteLength = chunkSize;
    }
    chunkPointer += 12 + chunkSize + chunkChildSize;
  }

  if (sizeBegin === -1 || sizeEnd === -1 || voxelBegin === -1 || voxelEnd === -1) {
    return { error: 'missing chunks' };
  }

  const size = [
    data.getUint32(sizeBegin, true),
    data.getUint32(sizeBegin + 8, true),
    data.getUint32(sizeBegin + 4, true),
  ];

  let palette;
  if (paletteBegin === -1 || paletteLength === -1) {
    palette = defaultPalette;
  } else {
    palette = [];
    const rawpalette = new Uint8Array(ab, paletteBegin, paletteLength);
    for (let i = 0, j = 0, ref3 = paletteLength; j < ref3; i = j += 4) {
      if (rawpalette[i] === 255 && rawpalette[i + 1] === 0 && rawpalette[i + 2] === 255) {
        palette.push({
          r: 255,
          g: 0,
          b: 255,
          a: 250,
          t: 7,
          s: 7
        });
      } else {
        palette.push({
          r: rawpalette[i],
          g: rawpalette[i + 1],
          b: rawpalette[i + 2],
          a: 255,
          t: 0,
          s: 0
        });
      }
    }
  }

  const result = ndarray(new Int32Array(size[0] * size[1] * size[2]), size);

  const voxelCount = data.getUint32(voxelBegin, true);
  if (voxelBegin + 4 + 4 * voxelCount !== voxelEnd) {
    console.warn('invalid length of voxel chunk');
  }

  const rawvoxels = new Uint8Array(ab, voxelBegin + 4, 4 * voxelCount);
  for (let i = 0, k = 0, ref4 = 4 * voxelCount; k < ref4; i = k += 4) {
    const z = size[2] - rawvoxels[i + 1] - 1;
    const vox = palette[rawvoxels[i + 3] - 1];
    result.set(size[0] - rawvoxels[i] - 1, rawvoxels[i + 2], z, rgbToHex(vox));
    // voxels[z][rawvoxels[i + 2]][size[0] - rawvoxels[i] - 1] = {
    //   r: vox.r,
    //   g: vox.g,
    //   b: vox.b,
    //   a: vox.a,
    //   s: vox.s,
    //   t: vox.t
    // };
  }

  return { result };
}

export function exportFile() {

}

// var MagicaIO,
//   extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
//   hasProp = {}.hasOwnProperty;

// MagicaIO = (function(superClass) {
//   extend(MagicaIO, superClass);

//   function MagicaIO(ab: ArrayBuffer) {
//     var char, chunkChildSize, chunkId, chunkPointer, chunkSize, i, j, k, mainChunkChildSize, mainChunkId, mainChunkSize, meta, palette, paletteBegin, paletteLength, rawpalette, rawvoxels, ref, ref1, ref2, ref3, ref4, sizeBegin, sizeEnd, version, vox, voxelBegin, voxelCount, voxelEnd, z;

//     meta = ((function() {
//       var j, len, ref, results;
//       ref = new Uint8Array(ab.slice(0, 4));
//       results = [];
//       for (j = 0, len = ref.length; j < len; j++) {
//         char = ref[j];
//         results.push(String.fromCharCode(char));
//       }
//       return results;
//     })()).join('');
//     console.log("meta: " + meta + " (expected VOX )");
//     if (meta !== 'VOX ') {
//       throw new Error("Expected Magica Voxel header not found");
//     }

//     version = new Uint32Array(ab.slice(4, 8))[0];
//     console.log("version: " + version + " (expected 150)");
//     if (version !== 150) {
//       console.warn("Expected version 150 but found version: " + version + " (May result in errors)");
//     }

//     mainChunkId = ((function() {
//       var j, len, ref, results;
//       ref = new Uint8Array(ab.slice(8, 12));
//       results = [];
//       for (j = 0, len = ref.length; j < len; j++) {
//         char = ref[j];
//         results.push(String.fromCharCode(char));
//       }
//       return results;
//     })()).join('');
//     console.log("mainChunkId: " + mainChunkId + " (expected MAIN)");
//     if (mainChunkId !== 'MAIN') {
//       throw new Error("Didn't found main Chunk as expected");
//     }

//     ref = new Uint32Array(ab.slice(12, 20)), mainChunkSize = ref[0], mainChunkChildSize = ref[1];
//     console.log("mainChunkSize: " + mainChunkSize + " (expected 0)");
//     console.log("mainChunkChildSize: " + mainChunkChildSize);
//     if (20 + mainChunkChildSize !== ab.byteLength) {
//       console.warn(console.log("There shouldn't be any bytes left"));
//     }

//     chunkPointer = 20 + mainChunkSize;
//     sizeBegin = sizeEnd = voxelBegin = voxelEnd = paletteBegin = paletteLength = -1;
//     while (chunkPointer < 20 + mainChunkSize + mainChunkChildSize) {
//       chunkId = ((function() {
//         var j, len, ref1, results;
//         ref1 = new Uint8Array(ab.slice(chunkPointer, chunkPointer + 4));
//         results = [];
//         for (j = 0, len = ref1.length; j < len; j++) {
//           char = ref1[j];
//           results.push(String.fromCharCode(char));
//         }
//         return results;
//       })()).join('');
//       ref1 = new Uint32Array(ab.slice(chunkPointer + 4, chunkPointer + 12)), chunkSize = ref1[0], chunkChildSize = ref1[1];
//       console.log("found child chunk: " + chunkId + " with begin: " + (chunkPointer + 12) + ", size: " + chunkSize + " and childSize: " + chunkChildSize + " (expected 0)");
//       switch (chunkId) {
//         case "SIZE":
//           if (chunkSize !== 12) {
//             console.warn("invalid length of size chunk");
//           }
//           sizeBegin = chunkPointer + 12;
//           sizeEnd = sizeBegin + chunkSize;
//           break;
//         case "XYZI":
//           voxelBegin = chunkPointer + 12;
//           voxelEnd = voxelBegin + chunkSize;
//           break;
//         case "RGBA":
//           paletteBegin = chunkPointer + 12;
//           if (chunkSize !== 1024) {
//             console.warn("invalid length of palette chunk");
//           }
//           paletteLength = chunkSize;
//       }
//       chunkPointer += 12 + chunkSize + chunkChildSize;
//     }

//     if (sizeBegin === -1 || sizeEnd === -1 || voxelBegin === -1 || voxelEnd === -1) {
//       throw new Error("missing chunks");
//     }

//     ref2 = new Uint32Array(ab.slice(sizeBegin, sizeEnd)), this.x = ref2[0], this.z = ref2[1], this.y = ref2[2];
//     console.log("dimensions: width: " + this.x + " height: " + this.y + " depth: " + this.z);
//     palette = [];
//     if (paletteBegin === -1 || paletteLength === -1) {
//       palette = [ // default palette
//         {r: 255, g: 255, b: 255, a: 255, t: 0, s: 0}, {r: 255, g: 255, b: 204, a: 255, t: 0, s: 0}, {r: 255, g: 255, b: 153, a: 255, t: 0, s: 0},
//         {r: 255, g: 255, b: 102, a: 255, t: 0, s: 0}, {r: 255, g: 255, b:  51, a: 255, t: 0, s: 0}, {r: 255, g: 255, b:   0, a: 255, t: 0, s: 0},
//         {r: 255, g: 204, b: 255, a: 255, t: 0, s: 0}, {r: 255, g: 204, b: 204, a: 255, t: 0, s: 0}, {r: 255, g: 204, b: 153, a: 255, t: 0, s: 0},
//         {r: 255, g: 204, b: 102, a: 255, t: 0, s: 0}, {r: 255, g: 204, b:  51, a: 255, t: 0, s: 0}, {r: 255, g: 204, b:   0, a: 255, t: 0, s: 0},
//         {r: 255, g: 153, b: 255, a: 255, t: 0, s: 0}, {r: 255, g: 153, b: 204, a: 255, t: 0, s: 0}, {r: 255, g: 153, b: 153, a: 255, t: 0, s: 0},
//         {r: 255, g: 153, b: 102, a: 255, t: 0, s: 0}, {r: 255, g: 153, b:  51, a: 255, t: 0, s: 0}, {r: 255, g: 153, b:   0, a: 255, t: 0, s: 0},
//         {r: 255, g: 102, b: 255, a: 255, t: 0, s: 0}, {r: 255, g: 102, b: 204, a: 255, t: 0, s: 0}, {r: 255, g: 102, b: 153, a: 255, t: 0, s: 0},
//         {r: 255, g: 102, b: 102, a: 255, t: 0, s: 0}, {r: 255, g: 102, b:  51, a: 255, t: 0, s: 0}, {r: 255, g: 102, b:   0, a: 255, t: 0, s: 0},
//         {r: 255, g:  51, b: 255, a: 255, t: 0, s: 0}, {r: 255, g:  51, b: 204, a: 255, t: 0, s: 0}, {r: 255, g:  51, b: 153, a: 255, t: 0, s: 0},
//         {r: 255, g:  51, b: 102, a: 255, t: 0, s: 0}, {r: 255, g:  51, b:  51, a: 255, t: 0, s: 0}, {r: 255, g:  51, b:   0, a: 255, t: 0, s: 0},
//         {r: 255, g:   0, b: 255, a: 250, t: 7, s: 7}, {r: 255, g:   0, b: 204, a: 255, t: 0, s: 0}, {r: 255, g:   0, b: 153, a: 255, t: 0, s: 0},
//         {r: 255, g:   0, b: 102, a: 255, t: 0, s: 0}, {r: 255, g:   0, b:  51, a: 255, t: 0, s: 0}, {r: 255, g:   0, b:   0, a: 255, t: 0, s: 0},
//         {r: 204, g: 255, b: 255, a: 255, t: 0, s: 0}, {r: 204, g: 255, b: 204, a: 255, t: 0, s: 0}, {r: 204, g: 255, b: 153, a: 255, t: 0, s: 0},
//         {r: 204, g: 255, b: 102, a: 255, t: 0, s: 0}, {r: 204, g: 255, b:  51, a: 255, t: 0, s: 0}, {r: 204, g: 255, b:   0, a: 255, t: 0, s: 0},
//         {r: 204, g: 204, b: 255, a: 255, t: 0, s: 0}, {r: 204, g: 204, b: 204, a: 255, t: 0, s: 0}, {r: 204, g: 204, b: 153, a: 255, t: 0, s: 0},
//         {r: 204, g: 204, b: 102, a: 255, t: 0, s: 0}, {r: 204, g: 204, b:  51, a: 255, t: 0, s: 0}, {r: 204, g: 204, b:   0, a: 255, t: 0, s: 0},
//         {r: 204, g: 153, b: 255, a: 255, t: 0, s: 0}, {r: 204, g: 153, b: 204, a: 255, t: 0, s: 0}, {r: 204, g: 153, b: 153, a: 255, t: 0, s: 0},
//         {r: 204, g: 153, b: 102, a: 255, t: 0, s: 0}, {r: 204, g: 153, b:  51, a: 255, t: 0, s: 0}, {r: 204, g: 153, b:   0, a: 255, t: 0, s: 0},
//         {r: 204, g: 102, b: 255, a: 255, t: 0, s: 0}, {r: 204, g: 102, b: 204, a: 255, t: 0, s: 0}, {r: 204, g: 102, b: 153, a: 255, t: 0, s: 0},
//         {r: 204, g: 102, b: 102, a: 255, t: 0, s: 0}, {r: 204, g: 102, b:  51, a: 255, t: 0, s: 0}, {r: 204, g: 102, b:   0, a: 255, t: 0, s: 0},
//         {r: 204, g:  51, b: 255, a: 255, t: 0, s: 0}, {r: 204, g:  51, b: 204, a: 255, t: 0, s: 0}, {r: 204, g:  51, b: 153, a: 255, t: 0, s: 0},
//         {r: 204, g:  51, b: 102, a: 255, t: 0, s: 0}, {r: 204, g:  51, b:  51, a: 255, t: 0, s: 0}, {r: 204, g:  51, b:   0, a: 255, t: 0, s: 0},
//         {r: 204, g:   0, b: 255, a: 255, t: 0, s: 0}, {r: 204, g:   0, b: 204, a: 255, t: 0, s: 0}, {r: 204, g:   0, b: 153, a: 255, t: 0, s: 0},
//         {r: 204, g:   0, b: 102, a: 255, t: 0, s: 0}, {r: 204, g:   0, b:  51, a: 255, t: 0, s: 0}, {r: 204, g:   0, b:   0, a: 255, t: 0, s: 0},
//         {r: 153, g: 255, b: 255, a: 255, t: 0, s: 0}, {r: 153, g: 255, b: 204, a: 255, t: 0, s: 0}, {r: 153, g: 255, b: 153, a: 255, t: 0, s: 0},
//         {r: 153, g: 255, b: 102, a: 255, t: 0, s: 0}, {r: 153, g: 255, b:  51, a: 255, t: 0, s: 0}, {r: 153, g: 255, b:   0, a: 255, t: 0, s: 0},
//         {r: 153, g: 204, b: 255, a: 255, t: 0, s: 0}, {r: 153, g: 204, b: 204, a: 255, t: 0, s: 0}, {r: 153, g: 204, b: 153, a: 255, t: 0, s: 0},
//         {r: 153, g: 204, b: 102, a: 255, t: 0, s: 0}, {r: 153, g: 204, b:  51, a: 255, t: 0, s: 0}, {r: 153, g: 204, b:   0, a: 255, t: 0, s: 0},
//         {r: 153, g: 153, b: 255, a: 255, t: 0, s: 0}, {r: 153, g: 153, b: 204, a: 255, t: 0, s: 0}, {r: 153, g: 153, b: 153, a: 255, t: 0, s: 0},
//         {r: 153, g: 153, b: 102, a: 255, t: 0, s: 0}, {r: 153, g: 153, b:  51, a: 255, t: 0, s: 0}, {r: 153, g: 153, b:   0, a: 255, t: 0, s: 0},
//         {r: 153, g: 102, b: 255, a: 255, t: 0, s: 0}, {r: 153, g: 102, b: 204, a: 255, t: 0, s: 0}, {r: 153, g: 102, b: 153, a: 255, t: 0, s: 0},
//         {r: 153, g: 102, b: 102, a: 255, t: 0, s: 0}, {r: 153, g: 102, b:  51, a: 255, t: 0, s: 0}, {r: 153, g: 102, b:   0, a: 255, t: 0, s: 0},
//         {r: 153, g:  51, b: 255, a: 255, t: 0, s: 0}, {r: 153, g:  51, b: 204, a: 255, t: 0, s: 0}, {r: 153, g:  51, b: 153, a: 255, t: 0, s: 0},
//         {r: 153, g:  51, b: 102, a: 255, t: 0, s: 0}, {r: 153, g:  51, b:  51, a: 255, t: 0, s: 0}, {r: 153, g:  51, b:   0, a: 255, t: 0, s: 0},
//         {r: 153, g:   0, b: 255, a: 255, t: 0, s: 0}, {r: 153, g:   0, b: 204, a: 255, t: 0, s: 0}, {r: 153, g:   0, b: 153, a: 255, t: 0, s: 0},
//         {r: 153, g:   0, b: 102, a: 255, t: 0, s: 0}, {r: 153, g:   0, b:  51, a: 255, t: 0, s: 0}, {r: 153, g:   0, b:   0, a: 255, t: 0, s: 0},
//         {r: 102, g: 255, b: 255, a: 255, t: 0, s: 0}, {r: 102, g: 255, b: 204, a: 255, t: 0, s: 0}, {r: 102, g: 255, b: 153, a: 255, t: 0, s: 0},
//         {r: 102, g: 255, b: 102, a: 255, t: 0, s: 0}, {r: 102, g: 255, b:  51, a: 255, t: 0, s: 0}, {r: 102, g: 255, b:   0, a: 255, t: 0, s: 0},
//         {r: 102, g: 204, b: 255, a: 255, t: 0, s: 0}, {r: 102, g: 204, b: 204, a: 255, t: 0, s: 0}, {r: 102, g: 204, b: 153, a: 255, t: 0, s: 0},
//         {r: 102, g: 204, b: 102, a: 255, t: 0, s: 0}, {r: 102, g: 204, b:  51, a: 255, t: 0, s: 0}, {r: 102, g: 204, b:   0, a: 255, t: 0, s: 0},
//         {r: 102, g: 153, b: 255, a: 255, t: 0, s: 0}, {r: 102, g: 153, b: 204, a: 255, t: 0, s: 0}, {r: 102, g: 153, b: 153, a: 255, t: 0, s: 0},
//         {r: 102, g: 153, b: 102, a: 255, t: 0, s: 0}, {r: 102, g: 153, b:  51, a: 255, t: 0, s: 0}, {r: 102, g: 153, b:   0, a: 255, t: 0, s: 0},
//         {r: 102, g: 102, b: 255, a: 255, t: 0, s: 0}, {r: 102, g: 102, b: 204, a: 255, t: 0, s: 0}, {r: 102, g: 102, b: 153, a: 255, t: 0, s: 0},
//         {r: 102, g: 102, b: 102, a: 255, t: 0, s: 0}, {r: 102, g: 102, b:  51, a: 255, t: 0, s: 0}, {r: 102, g: 102, b:   0, a: 255, t: 0, s: 0},
//         {r: 102, g:  51, b: 255, a: 255, t: 0, s: 0}, {r: 102, g:  51, b: 204, a: 255, t: 0, s: 0}, {r: 102, g:  51, b: 153, a: 255, t: 0, s: 0},
//         {r: 102, g:  51, b: 102, a: 255, t: 0, s: 0}, {r: 102, g:  51, b:  51, a: 255, t: 0, s: 0}, {r: 102, g:  51, b:   0, a: 255, t: 0, s: 0},
//         {r: 102, g:   0, b: 255, a: 255, t: 0, s: 0}, {r: 102, g:   0, b: 204, a: 255, t: 0, s: 0}, {r: 102, g:   0, b: 153, a: 255, t: 0, s: 0},
//         {r: 102, g:   0, b: 102, a: 255, t: 0, s: 0}, {r: 102, g:   0, b:  51, a: 255, t: 0, s: 0}, {r: 102, g:   0, b:   0, a: 255, t: 0, s: 0},
//         {r:  51, g: 255, b: 255, a: 255, t: 0, s: 0}, {r:  51, g: 255, b: 204, a: 255, t: 0, s: 0}, {r:  51, g: 255, b: 153, a: 255, t: 0, s: 0},
//         {r:  51, g: 255, b: 102, a: 255, t: 0, s: 0}, {r:  51, g: 255, b:  51, a: 255, t: 0, s: 0}, {r:  51, g: 255, b:   0, a: 255, t: 0, s: 0},
//         {r:  51, g: 204, b: 255, a: 255, t: 0, s: 0}, {r:  51, g: 204, b: 204, a: 255, t: 0, s: 0}, {r:  51, g: 204, b: 153, a: 255, t: 0, s: 0},
//         {r:  51, g: 204, b: 102, a: 255, t: 0, s: 0}, {r:  51, g: 204, b:  51, a: 255, t: 0, s: 0}, {r:  51, g: 204, b:   0, a: 255, t: 0, s: 0},
//         {r:  51, g: 153, b: 255, a: 255, t: 0, s: 0}, {r:  51, g: 153, b: 204, a: 255, t: 0, s: 0}, {r:  51, g: 153, b: 153, a: 255, t: 0, s: 0},
//         {r:  51, g: 153, b: 102, a: 255, t: 0, s: 0}, {r:  51, g: 153, b:  51, a: 255, t: 0, s: 0}, {r:  51, g: 153, b:   0, a: 255, t: 0, s: 0},
//         {r:  51, g: 102, b: 255, a: 255, t: 0, s: 0}, {r:  51, g: 102, b: 204, a: 255, t: 0, s: 0}, {r:  51, g: 102, b: 153, a: 255, t: 0, s: 0},
//         {r:  51, g: 102, b: 102, a: 255, t: 0, s: 0}, {r:  51, g: 102, b:  51, a: 255, t: 0, s: 0}, {r:  51, g: 102, b:   0, a: 255, t: 0, s: 0},
//         {r:  51, g:  51, b: 255, a: 255, t: 0, s: 0}, {r:  51, g:  51, b: 204, a: 255, t: 0, s: 0}, {r:  51, g:  51, b: 153, a: 255, t: 0, s: 0},
//         {r:  51, g:  51, b: 102, a: 255, t: 0, s: 0}, {r:  51, g:  51, b:  51, a: 255, t: 0, s: 0}, {r:  51, g:  51, b:   0, a: 255, t: 0, s: 0},
//         {r:  51, g:   0, b: 255, a: 255, t: 0, s: 0}, {r:  51, g:   0, b: 204, a: 255, t: 0, s: 0}, {r:  51, g:   0, b: 153, a: 255, t: 0, s: 0},
//         {r:  51, g:   0, b: 102, a: 255, t: 0, s: 0}, {r:  51, g:   0, b:  51, a: 255, t: 0, s: 0}, {r:  51, g:   0, b:   0, a: 255, t: 0, s: 0},
//         {r:   0, g: 255, b: 255, a: 255, t: 0, s: 0}, {r:   0, g: 255, b: 204, a: 255, t: 0, s: 0}, {r:   0, g: 255, b: 153, a: 255, t: 0, s: 0},
//         {r:   0, g: 255, b: 102, a: 255, t: 0, s: 0}, {r:   0, g: 255, b:  51, a: 255, t: 0, s: 0}, {r:   0, g: 255, b:   0, a: 255, t: 0, s: 0},
//         {r:   0, g: 204, b: 255, a: 255, t: 0, s: 0}, {r:   0, g: 204, b: 204, a: 255, t: 0, s: 0}, {r:   0, g: 204, b: 153, a: 255, t: 0, s: 0},
//         {r:   0, g: 204, b: 102, a: 255, t: 0, s: 0}, {r:   0, g: 204, b:  51, a: 255, t: 0, s: 0}, {r:   0, g: 204, b:   0, a: 255, t: 0, s: 0},
//         {r:   0, g: 153, b: 255, a: 255, t: 0, s: 0}, {r:   0, g: 153, b: 204, a: 255, t: 0, s: 0}, {r:   0, g: 153, b: 153, a: 255, t: 0, s: 0},
//         {r:   0, g: 153, b: 102, a: 255, t: 0, s: 0}, {r:   0, g: 153, b:  51, a: 255, t: 0, s: 0}, {r:   0, g: 153, b:   0, a: 255, t: 0, s: 0},
//         {r:   0, g: 102, b: 255, a: 255, t: 0, s: 0}, {r:   0, g: 102, b: 204, a: 255, t: 0, s: 0}, {r:   0, g: 102, b: 153, a: 255, t: 0, s: 0},
//         {r:   0, g: 102, b: 102, a: 255, t: 0, s: 0}, {r:   0, g: 102, b:  51, a: 255, t: 0, s: 0}, {r:   0, g: 102, b:   0, a: 255, t: 0, s: 0},
//         {r:   0, g:  51, b: 255, a: 255, t: 0, s: 0}, {r:   0, g:  51, b: 204, a: 255, t: 0, s: 0}, {r:   0, g:  51, b: 153, a: 255, t: 0, s: 0},
//         {r:   0, g:  51, b: 102, a: 255, t: 0, s: 0}, {r:   0, g:  51, b:  51, a: 255, t: 0, s: 0}, {r:   0, g:  51, b:   0, a: 255, t: 0, s: 0},
//         {r:   0, g:   0, b: 255, a: 255, t: 0, s: 0}, {r:   0, g:   0, b: 204, a: 255, t: 0, s: 0}, {r:   0, g:   0, b: 153, a: 255, t: 0, s: 0},
//         {r:   0, g:   0, b: 102, a: 255, t: 0, s: 0}, {r:   0, g:   0, b:  51, a: 255, t: 0, s: 0}, {r: 238, g:   0, b:   0, a: 255, t: 0, s: 0},
//         {r: 221, g:   0, b:   0, a: 255, t: 0, s: 0}, {r: 187, g:   0, b:   0, a: 255, t: 0, s: 0}, {r: 170, g:   0, b:   0, a: 255, t: 0, s: 0},
//         {r: 136, g:   0, b:   0, a: 255, t: 0, s: 0}, {r: 119, g:   0, b:   0, a: 255, t: 0, s: 0}, {r:  85, g:   0, b:   0, a: 255, t: 0, s: 0},
//         {r:  68, g:   0, b:   0, a: 255, t: 0, s: 0}, {r:  34, g:   0, b:   0, a: 255, t: 0, s: 0}, {r:  17, g:   0, b:   0, a: 255, t: 0, s: 0},
//         {r:   0, g: 238, b:   0, a: 255, t: 0, s: 0}, {r:   0, g: 221, b:   0, a: 255, t: 0, s: 0}, {r:   0, g: 187, b:   0, a: 255, t: 0, s: 0},
//         {r:   0, g: 170, b:   0, a: 255, t: 0, s: 0}, {r:   0, g: 136, b:   0, a: 255, t: 0, s: 0}, {r:   0, g: 119, b:   0, a: 255, t: 0, s: 0},
//         {r:   0, g:  85, b:   0, a: 255, t: 0, s: 0}, {r:   0, g:  68, b:   0, a: 255, t: 0, s: 0}, {r:   0, g:  34, b:   0, a: 255, t: 0, s: 0},
//         {r:   0, g:  17, b:   0, a: 255, t: 0, s: 0}, {r:   0, g:   0, b: 238, a: 255, t: 0, s: 0}, {r:   0, g:   0, b: 221, a: 255, t: 0, s: 0},
//         {r:   0, g:   0, b: 187, a: 255, t: 0, s: 0}, {r:   0, g:   0, b: 170, a: 255, t: 0, s: 0}, {r:   0, g:   0, b: 136, a: 255, t: 0, s: 0},
//         {r:   0, g:   0, b: 119, a: 255, t: 0, s: 0}, {r:   0, g:   0, b:  85, a: 255, t: 0, s: 0}, {r:   0, g:   0, b:  68, a: 255, t: 0, s: 0},
//         {r:   0, g:   0, b:  34, a: 255, t: 0, s: 0}, {r:   0, g:   0, b:  17, a: 255, t: 0, s: 0}, {r: 238, g: 238, b: 238, a: 255, t: 0, s: 0},
//         {r: 221, g: 221, b: 221, a: 255, t: 0, s: 0}, {r: 187, g: 187, b: 187, a: 255, t: 0, s: 0}, {r: 170, g: 170, b: 170, a: 255, t: 0, s: 0},
//         {r: 136, g: 136, b: 136, a: 255, t: 0, s: 0}, {r: 119, g: 119, b: 119, a: 255, t: 0, s: 0}, {r:  85, g:  85, b:  85, a: 255, t: 0, s: 0},
//         {r:  68, g:  68, b:  68, a: 255, t: 0, s: 0}, {r:  34, g:  34, b:  34, a: 255, t: 0, s: 0}, {r:  17, g:  17, b:  17, a: 255, t: 0, s: 0}
//       ];
//       console.log("default palette");
//     } else {
//       rawpalette = new Uint8Array(ab.slice(paletteBegin, paletteBegin + paletteLength));
//       for (i = j = 0, ref3 = paletteLength; j < ref3; i = j += 4) {
//         if (rawpalette[i] === 255 && rawpalette[i + 1] === 0 && rawpalette[i + 2] === 255) {
//           palette.push({
//             r: 255,
//             g: 0,
//             b: 255,
//             a: 250,
//             t: 7,
//             s: 7
//           });
//         } else {
//           palette.push({
//             r: rawpalette[i],
//             g: rawpalette[i + 1],
//             b: rawpalette[i + 2],
//             a: 255,
//             t: 0,
//             s: 0
//           });
//         }
//       }
//       console.log("palette:");
//       console.log(palette);
//     }






//     this.voxels = [];
//     voxelCount = new Uint32Array(ab.slice(voxelBegin, voxelBegin + 4))[0];
//     console.log("voxel count: " + voxelCount);
//     if (voxelBegin + 4 + 4 * voxelCount !== voxelEnd) {
//       console.warn("invalid length of voxel chunk");
//     }
//     rawvoxels = new Uint8Array(ab.slice(voxelBegin + 4, voxelBegin + 4 + 4 * voxelCount));
//     for (i = k = 0, ref4 = 4 * voxelCount; k < ref4; i = k += 4) {
//       z = this.z - rawvoxels[i + 1] - 1;
//       if (this.voxels[z] == null) {
//         this.voxels[z] = [];
//       }
//       if (this.voxels[z][rawvoxels[i + 2]] == null) {
//         this.voxels[z][rawvoxels[i + 2]] = [];
//       }
//       vox = palette[rawvoxels[i + 3] - 1];
//       this.voxels[z][rawvoxels[i + 2]][this.x - rawvoxels[i] - 1] = {
//         r: vox.r,
//         g: vox.g,
//         b: vox.b,
//         a: vox.a,
//         s: vox.s,
//         t: vox.t
//       };
//     }
//     console.log("voxels:");
//     console.log(this.voxels);
//   }

// //   MagicaIO.prototype["export"] = function() {
// //     var c1, c2, c3, c4, data, helpPalette, i, iz, j, k, l, paletteChunk, ref, ref1, ref10, ref2, ref3, ref4, ref5, ref6, ref7, ref8, ref9, rgba, s1, s2, s3, s4, sizeChunk, voxelChunk, x, x1, x2, x3, x4, y, y1, y2, y3, y4, z, z1, z2, z3, z4;
// //     data = [86, 79, 88, 32, 150, 0, 0, 0, 77, 65, 73, 78, 0, 0, 0, 0];
// //     ref = new Uint8Array(new Uint32Array([this.x]).buffer), x1 = ref[0], x2 = ref[1], x3 = ref[2], x4 = ref[3];
// //     ref1 = new Uint8Array(new Uint32Array([this.z]).buffer), y1 = ref1[0], y2 = ref1[1], y3 = ref1[2], y4 = ref1[3];
// //     ref2 = new Uint8Array(new Uint32Array([this.y]).buffer), z1 = ref2[0], z2 = ref2[1], z3 = ref2[2], z4 = ref2[3];
// //     sizeChunk = [83, 73, 90, 69, 12, 0, 0, 0, 0, 0, 0, 0, x1, x2, x3, x4, y1, y2, y3, y4, z1, z2, z3, z4];
// //     voxelChunk = [];
// //     paletteChunk = [82, 71, 66, 65, 0, 4, 0, 0, 0, 0, 0, 0];
// //     helpPalette = {};
// //     for (z = j = 0, ref3 = this.z; j < ref3; z = j += 1) {
// //       iz = this.z - z - 1;
// //       for (y = k = 0, ref4 = this.y; k < ref4; y = k += 1) {
// //         for (x = l = 0, ref5 = this.x; l < ref5; x = l += 1) {
// //           if (!(((ref6 = this.voxels[z]) != null ? (ref7 = ref6[y]) != null ? ref7[x] : void 0 : void 0) != null)) {
// //             continue;
// //           }
// //           rgba = ((this.voxels[z][y][x].r << 24) | (this.voxels[z][y][x].g << 16) | (this.voxels[z][y][x].b << 8) | 255) >>> 0;
// //           i = helpPalette[rgba];
// //           if (i == null) {
// //             if (!(paletteChunk.length < 1036)) {
// //               throw new Error("To many colors for Magica Voxel palette");
// //             }
// //             paletteChunk.push(this.voxels[z][y][x].r, this.voxels[z][y][x].g, this.voxels[z][y][x].b, 255);
// //             i = paletteChunk.length / 4 - 3;
// //             helpPalette[rgba] = i;
// //           }
// //           voxelChunk.push(this.x - x - 1, iz, y, i);
// //         }
// //       }
// //     }
// //     while (paletteChunk.length < 1036) {
// //       paletteChunk.push(255, 255, 255, 255);
// //     }
// //     ref8 = new Uint8Array(new Uint32Array([1076 + voxelChunk.length]).buffer), s1 = ref8[0], s2 = ref8[1], s3 = ref8[2], s4 = ref8[3];
// //     data.push(s1, s2, s3, s4);
// //     data = data.concat(sizeChunk);
// //     ref9 = new Uint8Array(new Uint32Array([voxelChunk.length + 4]).buffer), s1 = ref9[0], s2 = ref9[1], s3 = ref9[2], s4 = ref9[3];
// //     ref10 = new Uint8Array(new Uint32Array([voxelChunk.length / 4]).buffer), c1 = ref10[0], c2 = ref10[1], c3 = ref10[2], c4 = ref10[3];
// //     data.push(88, 89, 90, 73, s1, s2, s3, s4, 0, 0, 0, 0, c1, c2, c3, c4);
// //     data = data.concat(voxelChunk);
// //     data = data.concat(paletteChunk);
// //     console.log("export Magica:");
// //     console.log(data);
// //     return new Uint8Array(data);
// //   };

// //   return MagicaIO;

// // })(require('./IO.coffee'));

// // module.exports = MagicaIO;
