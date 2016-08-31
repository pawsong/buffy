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
  const mesh = mesher(model);
  const data: Uint8Array = msgpack.encode({
    buffer: pako.deflate(model.data.buffer),
    shape: model.shape,
    stride: model.stride,
    offset: model.offset,
  });
  return {
    result: new Uint8Array(data),
  };
}
