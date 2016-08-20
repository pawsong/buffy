import * as ndarray from 'ndarray';
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
