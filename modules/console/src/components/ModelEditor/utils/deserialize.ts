import * as pako from 'pako';
import * as ndarray from 'ndarray';

const msgpack = require('msgpack-lite');

import {
  Axis,
} from '../types';

import {
  ModelFileType,
  MaterialMapType,
} from '../../../types';

import createFileState from './createFileState';

function deserialize (buffer: Uint8Array) {
  const data = msgpack.decode(buffer);
  const inflated = pako.inflate(data.data);
  const model = ndarray(new Int32Array(inflated.buffer), data.shape);

  return createFileState({
    type: ModelFileType.DEFAULT,
    size: data.shape,
    maps: {
      [MaterialMapType.DEFAULT]: model,
    },
    activeMap: MaterialMapType.DEFAULT,
    selection: null,
    fragment: null,
    fragmentOffset: [0, 0, 0],
    mode2d: {
      enabled: false,
      initialized: false,
      axis: Axis.X,
      position: 0,
    }
  });
}

export default deserialize;
