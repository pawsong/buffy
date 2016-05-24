import * as ndarray from 'ndarray';

import undoable from '@pasta/helper/lib/undoable';

import {
  Position,
  Action,
  Voxel,
  Volumn,
} from '../types';

import {
  VOXEL_ADD, VoxelAddAction,
  VOXEL_ADD_BATCH, VoxelAddBatchAction,
  VOXEL_REMOVE, VoxelRemoveAction,
  VOXEL_REMOVE_BATCH, VoxelRemoveBatchAction,
  VOXEL_ROTATE, VoxelRotateAction,
} from '../actions';

import {
  DESIGN_IMG_SIZE,
} from '../../../canvas/Constants';

import mesher from '../../../canvas/meshers/greedy';

const matrix = ndarray(new Int32Array(16 * 16 * 16), [16, 16, 16]);
matrix.set(0,1,1, 1 << 24 | 0xff << 8);
matrix.set(1,1,1, 1 << 24 | 0xff << 8);

const initialState = {
  matrix,
  mesh: mesher(matrix.data, matrix.shape),
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

function matrixReducer(state: ndarray.Ndarray, action: Action<any>): ndarray.Ndarray {
  switch (action.type) {
    case VOXEL_ADD_BATCH: {
      const { volumn, color } = <VoxelAddBatchAction>action;
      const c = rgbToHex(color);
      const nextState = ndarray(state.data.slice(), state.shape);

      for (let i = volumn[0]; i <= volumn[1]; ++i) {
        for (let j = volumn[2]; j <= volumn[3]; ++j) {
          for (let k = volumn[4]; k <= volumn[5]; ++k) {
            nextState.set(k, j, i, c);
          }
        }
      }
      return nextState;
    }
    case VOXEL_REMOVE_BATCH: {
      const { positions } = <VoxelRemoveBatchAction>action;

      const nextState = ndarray(state.data.slice(), state.shape);
      positions.forEach(position => {
        nextState.set(position[2], position[1], position[0], 0);
      });
      return nextState;
    }
    case VOXEL_ROTATE: {
      const { axis } = <VoxelRotateAction>action;
      const rotate = rotates[axis];
      if (!rotate) return state;

      const xLen = state.shape[0];
      const yLen = state.shape[1];
      const zLen = state.shape[2];
      const nextState = ndarray(new Int32Array(xLen * yLen * zLen), state.shape);

      // TODO: Support user define shape
      const shape: Shape = [ DESIGN_IMG_SIZE, DESIGN_IMG_SIZE, DESIGN_IMG_SIZE ];

      for (let i = 0; i < xLen; ++i) {
        for (let j = 0; j < yLen; ++j) {
          for (let k = 0; k < zLen; ++k) {
            const c = state.get(i, j, k);
            if (c === 0) continue;
            const pos = rotate(shape, [i, j, k]);
            nextState.set(pos[0], pos[1], pos[2], c);
          }
        }
      }

      return nextState;
    }
    default: {
      return state;
    }
  }
}

function mesh(reducer) {
  return function (state = initialState, action) {
    const nextMatrix = reducer(state.matrix, action);
    if (state.matrix === nextMatrix) return state;

    return Object.assign({}, state, {
      matrix: nextMatrix,
      mesh: mesher(nextMatrix.data, nextMatrix.shape),
    });
  }
}

export default undoable(mesh(matrixReducer));
