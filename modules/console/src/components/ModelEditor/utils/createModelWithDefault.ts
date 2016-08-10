import {Ndarray} from 'ndarray';
import createFileState from './createFileState';
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

function createModelWithDefault(matrix: Ndarray): FileState {
  const maps: MaterialMaps = {
    [MaterialMapType.DEFAULT]: matrix,
  };

  return createFileState({
    type: ModelFileType.DEFAULT,
    size: matrix.shape,
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
      itemType: TroveItemType.SWORD,
    },
  });
}

export default createModelWithDefault;
