import * as ndarray from 'ndarray';
import pako from 'pako';
const msgpack = require('msgpack-lite');
import mesher from '../../../canvas/meshers/greedy';

import {
  ImportResult,
  ExportResult,
} from '../types';

export function exportMeshFile(model: ndarray.Ndarray): ExportResult {
  const mesh = mesher(model);
  const data: Uint8Array = msgpack.encode({
    v: mesh.vertices,
    f: mesh.faces,
  });
  return {
    result: new Uint8Array(data),
  };
}

export function exportRawMeshFile(model: ndarray.Ndarray): ExportResult {
  const { shape } = model;

  const palette = new Map<number, number>();
  const paletteColors = [
    0x00000000, // Palette 0 means empty voxel
  ];

  const matrix = ndarray(new Uint16Array(shape[0] * shape[1] * shape[2]), shape);

  for (let i = 0; i < shape[0]; ++i) {
  for (let j = 0; j < shape[1]; ++j) {
  for (let k = 0; k < shape[2]; ++k) {
    const c = model.get(i, j, k);
    if (c === 0) continue;

    let idx = palette.get(c);
    if (!idx) {
      idx = paletteColors.length;
      if (idx > 0x7fff) throw new Error('Exceeds palette size limit');

      paletteColors.push(c);
      palette.set(c, idx);
    }
    matrix.set(i, j, k, idx);
  }
  }
  }

  const paletteBin = new Uint32Array(paletteColors.length);
  for (let i = 1, len = paletteColors.length; i < len; ++i) {
    paletteBin[i] = 0xff000000 | paletteColors[i];
  }

  const data: Uint8Array = msgpack.encode({
    palette: paletteBin.buffer, // There is not much benefit from pako
    buffer: pako.deflate(matrix.data.buffer),
    shape: matrix.shape,
    stride: matrix.stride,
    offset: matrix.offset,
  });
  return {
    result: new Uint8Array(data),
  };
}
