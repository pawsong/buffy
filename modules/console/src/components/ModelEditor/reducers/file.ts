import * as ndarray from 'ndarray';

import undoable from '@pasta/helper/lib/undoable';

import {
  Position,
  Action,
  Voxel,
  Volumn,
  VoxelData,
} from '../types';

import {
  VOXEL_ADD, VoxelAddAction,
  VOXEL_ADD_BATCH, VoxelAddBatchAction,
  VOXEL_REMOVE, VoxelRemoveAction,
  VOXEL_REMOVE_BATCH, VoxelRemoveBatchAction,
  VOXEL_ROTATE, VoxelRotateAction,
  VOXEL_SELECT_BOX, VoxelSelectBoxAction,
} from '../actions';

import {
  DESIGN_IMG_SIZE,
} from '../../../canvas/Constants';

import mesher from '../../../canvas/meshers/greedy';

const initialMatrix = ndarray(new Int32Array(16 * 16 * 16), [16, 16, 16]);
initialMatrix.set(0,1,1, 1 << 24 | 0xff << 8);
initialMatrix.set(1,1,1, 1 << 24 | 0xff << 8);

const initialState: VoxelData = {
  matrix: initialMatrix,
  mesh: mesher(initialMatrix.data, initialMatrix.shape),
  selection: null,
  selectionMesh: null,
};

export function rgbToHex({ r, g, b }) {
  return (1 << 24) /* Used by mesher */ | (r << 16) | (g << 8) | b;
}

type Shape = [number /* width */, number /* height */, number /* depth */];

interface RotateFn {
  (shape: Shape, position: Position): Position;
}

const rotates: { [index: string]: RotateFn } = {
  x: (shape, pos) => ([ pos[0],            shape[2] - pos[2], pos[1]            ]),
  y: (shape, pos) => ([ pos[2],            pos[1],            shape[0] - pos[0] ]),
  z: (shape, pos) => ([ shape[1] - pos[1], pos[0],            pos[2]            ]),
};

function voxelDataReducer(state = initialState, action: Action<any>): VoxelData {
  switch (action.type) {
    case VOXEL_ADD_BATCH: {
      const { volumn, color } = <VoxelAddBatchAction>action;
      const c = rgbToHex(color);
      const matrix = ndarray(state.matrix.data.slice(), state.matrix.shape);

      if (!state.selection) {
        for (let i = volumn[0]; i <= volumn[1]; ++i) {
          for (let j = volumn[2]; j <= volumn[3]; ++j) {
            for (let k = volumn[4]; k <= volumn[5]; ++k) {
              matrix.set(k, j, i, c);
            }
          }
        }
      } else {
        let changed = false;

        for (let i = volumn[0]; i <= volumn[1]; ++i) {
          for (let j = volumn[2]; j <= volumn[3]; ++j) {
            for (let k = volumn[4]; k <= volumn[5]; ++k) {
              if (state.selection.get(k, j, i)) {
                matrix.set(k, j, i, c);
                changed = true;
              }
            }
          }
        }

        if (!changed) return state;
      }

      return Object.assign({}, state, {
        matrix,
        mesh: mesher(matrix.data, matrix.shape),
      });
    }

    case VOXEL_SELECT_BOX: {
      const { volumn } = <VoxelSelectBoxAction>action;
      const selection = ndarray(
        new Int32Array(state.matrix.shape[0] * state.matrix.shape[1] * state.matrix.shape[2]),
        state.matrix.shape
      );

      let selected = false;

      for (let i = volumn[0]; i <= volumn[1]; ++i) {
        for (let j = volumn[2]; j <= volumn[3]; ++j) {
          for (let k = volumn[4]; k <= volumn[5]; ++k) {
            if (state.matrix.get(k, j, i) !== 0) {
              selection.set(k, j, i, 1);
              selected = true;
            }
          }
        }
      }

      if (!selected && !state.selection) return state;

      return Object.assign({}, state, {
        selection: selected ? selection : null,
        selectionMesh: selected ? mesher(selection.data, selection.shape): null,
      });
    }

    case VOXEL_REMOVE_BATCH: {
      const { positions } = <VoxelRemoveBatchAction>action;

      if (!state.selection) {
        const matrix = ndarray(state.matrix.data.slice(), state.matrix.shape);
        positions.forEach(position => {
          matrix.set(position[2], position[1], position[0], 0);
        });

        return Object.assign({}, state, {
          matrix,
          mesh: mesher(matrix.data, matrix.shape),
        });
      } else {
        let changed = false;

        const matrix = ndarray(state.matrix.data.slice(), state.matrix.shape);
        const selection = ndarray(state.selection.data.slice(), state.selection.shape);

        positions.forEach(position => {
          if (selection.get(position[2], position[1], position[0])) {
            matrix.set(position[2], position[1], position[0], 0);
            selection.set(position[2], position[1], position[0], 0);
            changed = true;
          }
        });

        if (!changed) return state;

        return Object.assign({}, state, {
          matrix,
          mesh: mesher(matrix.data, matrix.shape),
          selection,
          selectionMesh: mesher(selection.data, selection.shape),
        });
      }
    }

    case VOXEL_ROTATE: {
      const { axis } = <VoxelRotateAction>action;
      const rotate = rotates[axis];
      if (!rotate) return state;

      const width = state.matrix.shape[0];
      const height = state.matrix.shape[1];
      const depth = state.matrix.shape[2];
      const matrix = ndarray(new Int32Array(width * height * depth), state.matrix.shape);

      // TODO: Support user define shape
      const shape: Shape = [ DESIGN_IMG_SIZE, DESIGN_IMG_SIZE, DESIGN_IMG_SIZE ];

      for (let i = 0; i < width; ++i) {
        for (let j = 0; j < height; ++j) {
          for (let k = 0; k < depth; ++k) {
            const c = state.matrix.get(i, j, k);
            if (c === 0) continue;
            const pos = rotate(shape, [i, j, k]);
            matrix.set(pos[0], pos[1], pos[2], c);
          }
        }
      }

      if (!state.selection) {
        return Object.assign({}, state, {
          matrix,
          mesh: mesher(matrix.data, matrix.shape),
        });
      } else {
        const selection = ndarray(new Int32Array(width * height * depth), state.selection.shape);

        for (let i = 0; i < width; ++i) {
          for (let j = 0; j < height; ++j) {
            for (let k = 0; k < depth; ++k) {
              const c = state.selection.get(i, j, k);
              if (c === 0) continue;

              const pos = rotate(shape, [i, j, k]);
              selection.set(pos[0], pos[1], pos[2], c);
            }
          }
        }

        return Object.assign({}, state, {
          matrix,
          mesh: mesher(matrix.data, matrix.shape),
          selection,
          selectionMesh: mesher(selection.data, selection.shape),
        });
      }
    }

    default: {
      return state;
    }
  }
}

export default undoable(voxelDataReducer);
