import * as ndarray from 'ndarray';

import {
  ImportResult,
  ExportResult,
} from '../types';

import {
  rgbToHex,
} from '../canvas/utils';

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
      case 'SIZE': {
        if (chunkSize !== 12) {
          console.warn("invalid length of size chunk");
        }
        sizeBegin = chunkPointer + 12;
        sizeEnd = sizeBegin + chunkSize;
        break;
      }
      case 'XYZI': {
        voxelBegin = chunkPointer + 12;
        voxelEnd = voxelBegin + chunkSize;
        break;
      }
      case 'RGBA': {
        paletteBegin = chunkPointer + 12;
        if (chunkSize !== 1024) {
          console.warn("invalid length of palette chunk");
        }
        paletteLength = chunkSize;
        break;
      }
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
    for (let i = 0; i < paletteLength; i += 4) {
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
  for (let i = 0, len = 4 * voxelCount; i < len; i += 4) {
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

export function exportVoxFile(model: ndarray.Ndarray): ExportResult {
  const [w, h, d] = model.shape;

  let data = [
    86, 79, 88, 32, // VOX_
    150, 0, 0, 0, // 150 (version)
    77, 65, 73, 78, // MAIN
    0, 0, 0, 0, // 0 (main chunk size)
  ];

  // order is x, z, y
  const [x1, x2, x3, x4] = new Uint8Array(new Uint32Array([w]).buffer);
  const [y1, y2, y3, y4] = new Uint8Array(new Uint32Array([d]).buffer);
  const [z1, z2, z3, z4] = new Uint8Array(new Uint32Array([h]).buffer);

  const sizeChunk = [
    83, 73, 90, 69, // SIZE
    12, 0, 0, 0, // 12 (size chunk size)
    0, 0, 0, 0, // 0 (no children chunks)
    x1, x2, x3, x4, // width
    y1, y2, y3, y4, // height
    z1, z2, z3, z4, // depth
  ];

  // add header with id and size info later
  const voxelChunk = [];
  const paletteChunk = [
    82, 71, 66, 65, // RGBA
    0, 4, 0, 0, // 1024 (palette chunk size)
    0, 0, 0, 0, // 0 (no children chunks)
  ];

  const helpPalette = {};
  for (let z = 0; z < d; ++z) {
    const iz = d - z - 1;
    for (let y = 0; y < h; ++y) {
      for (let x = 0; x < w; ++x) {
        const c = model.get(x, y, z);
        if (!c) continue;

        let i = helpPalette[c];
        if (i === undefined) {
          if (!(paletteChunk.length < 1036)) {
            return { error: 'To many colors for Magica Voxel palette' };
          }

          const r = c >> 16 & 0xff;
          const g = c >> 8 & 0xff;
          const b = c & 0xff;

          paletteChunk.push(r, g, b, 255);
          i = paletteChunk.length / 4 - 3;
          helpPalette[c] = i;
        }
        voxelChunk.push(w - x - 1, iz, y, i);
      }
    }
  }

  while (paletteChunk.length < 1036) {
    paletteChunk.push(255, 255, 255, 255);
  }

  // main chunk: child chunk size
  const [cs1, cs2, cs3, cs4] = new Uint8Array(new Uint32Array([1076 + voxelChunk.length]).buffer);
  data.push(cs1, cs2, cs3, cs4);

  data = data.concat(sizeChunk);

  const [s1, s2, s3, s4] = new Uint8Array(new Uint32Array([voxelChunk.length + 4]).buffer);
  const [c1, c2, c3, c4] = new Uint8Array(new Uint32Array([voxelChunk.length / 4]).buffer);
  data.push(
    88, 89, 90, 73, // XYZI
    s1, s2, s3, s4, // size of voxel chunk
    0, 0, 0, 0, // 0, (no child chunks)
    c1, c2, c3, c4 // voxel count
  );

  data = data.concat(voxelChunk);
  data = data.concat(paletteChunk);

  return { result: new Uint8Array(data) };
}
