import * as pako from 'pako';
import * as ndarray from 'ndarray';

const msgpack = require('msgpack-lite');

import createFileState from './createFileState';

function deserialize (buffer: Uint8Array) {
  const data = msgpack.decode(buffer);
  const inflated = pako.inflate(data.data);
  const model = ndarray(new Int32Array(inflated.buffer), data.shape);

  return createFileState({
    size: data.shape,
    model,
    selection: null,
    fragment: null,
    fragmentOffset: [0, 0, 0],
  });
}

export default deserialize;
