import pako from 'pako';
import ndarray from 'ndarray';
import {
  ModelFileType,
  MaterialMapType,
} from '../../../types';
import {
  FileState,
  Axis,
  TroveItemType,
  MaterialMaps,
} from '../types';
import createFileState from './createFileState';

const msgpack = require('msgpack-lite');

const VERSION_1_0 = '1.0';
const VERSION_1_1 = '1.1';

function serialize(fileState: FileState): Uint8Array {
  const maps = {};
  Object.keys(fileState.present.data.maps).forEach(key => {
    const map = fileState.present.data.maps[key];
    maps[MaterialMapType[key]] = pako.deflate(map.data.buffer);
  });

  return msgpack.encode({
    version: VERSION_1_1,
    type: ModelFileType[fileState.present.data.type],
    maps,
    shape: fileState.present.data.size,
    trove: {
      itemType: TroveItemType[fileState.present.data.trove.itemType],
    },
  });
}

function deserialize(buffer: Uint8Array) {
  const data = msgpack.decode(buffer);

  switch (data.version) {
    case VERSION_1_0: {
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
        },
        trove: {
          itemType: TroveItemType.SWORD,
        },
      });
    }
    case VERSION_1_1: {
      const maps: MaterialMaps = {};
      Object.keys(data.maps).forEach(key => {
        const inflated = pako.inflate(data.maps[key]);
        maps[MaterialMapType[key]] = ndarray(new Int32Array(inflated.buffer), data.shape);
      });

      return createFileState({
        type: ModelFileType[data.type] as any,
        size: data.shape,
        maps,
        activeMap: MaterialMapType.DEFAULT,
        selection: null,
        fragment: null,
        fragmentOffset: [0, 0, 0],
        mode2d: {
          enabled: false,
          initialized: false,
          axis: Axis.X,
          position: 0,
        },
        trove: {
          itemType: TroveItemType[data.trove.itemType] as any,
        },
      });
    }
  }
}

export {
  serialize,
  deserialize,
}
