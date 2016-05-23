import * as Immutable from 'immutable';
import * as ndarray from 'ndarray';

import {
  Position,
  Action,
  Voxel,
  VoxelState,
  VoxelSnapshot,
  Volumn,
} from '../types';

import {
  VOXEL_INIT, VoxelInitAction,
  VOXEL_UNDO, VoxelUndoAction,
  VOXEL_UNDO_SEEK, VoxelUndoSeekAction,
  VOXEL_REDO, VoxelRedoAction,
  VOXEL_REDO_SEEK, VoxelRedoSeekAction,
  LOAD_WORKSPACE, LoadWorkspaceAction,
  VOXEL_ADD, VoxelAddAction,
  VOXEL_ADD_BATCH, VoxelAddBatchAction,
  VOXEL_REMOVE, VoxelRemoveAction,
  VOXEL_REMOVE_BATCH, VoxelRemoveBatchAction,
  VOXEL_ROTATE, VoxelRotateAction,
  SET_WORKSPACE, SetWorkspaceAction,
} from '../actions';

import {
  GRID_SIZE,
} from '../constants/Pixels';

import {
  DESIGN_IMG_SIZE,
} from '../../../canvas/Constants';

const objectAssign = require('object-assign');
const findIndex = require('lodash/findIndex');
import vector3ToString from '@pasta/helper/lib/vector3ToString';

const MAX_HISTORY_LEN = 20;

import mesher from '../../../canvas/meshers/greedy';

const matrix = ndarray(new Int32Array(16 * 16 * 16), [16, 16, 16]);
matrix.set(0,1,1, 1 << 24 | 0xff << 8);
matrix.set(1,1,1, 1 << 24 | 0xff << 8);

const initialState: VoxelState = {
  historyIndex: 1,
  past: [],
  present: {
    historyIndex: 1,
    action: VOXEL_INIT,
    data: {
      matrix,
      mesh: mesher(matrix.data, matrix.shape),
    },
  },
  future: [],
};

function mesh(reducer) {
  return function (state, action) {
    const nextMatrix = reducer(state.matrix, action);
    if (state.matrix === nextMatrix) return state;

    return Object.assign({}, state, {
      matrix: nextMatrix,
      mesh: mesher(nextMatrix.data, nextMatrix.shape),
    });
  }
}

const voxelUndoable = reducer => (state = initialState, action: Action<any>): VoxelState => {
  switch (action.type) {
    case VOXEL_UNDO: {
      const past = state.past.slice(0, state.past.length - 1);
      const present = state.past[state.past.length - 1];
      const future = [ state.present, ...state.future ];
      return {
        historyIndex: state.historyIndex,
        past,
        present,
        future,
      }
    }
    case VOXEL_UNDO_SEEK: {
      const { historyIndex } = <VoxelUndoSeekAction>action;
      const index = findIndex(state.past, { historyIndex });

      const past = state.past.slice(0, index);
      const present = state.past[index];
      const future = [
        ...state.past.slice(index + 1),
        state.present,
        ...state.future,
      ];
      return {
        historyIndex,
        past,
        present,
        future,
      }
    }
    case VOXEL_REDO: {
      const past = [ ...state.past, state.present ];
      const present = state.future[0];
      const future = state.future.slice(1);
      return {
        historyIndex: state.historyIndex,
        past,
        present,
        future,
      }
    }
    case VOXEL_REDO_SEEK: {
      const { historyIndex } = <VoxelRedoSeekAction>action;
      const index = findIndex(state.future, { historyIndex });

      const past = [
        ...state.past,
        state.present,
        ...state.future.slice(0, index),
      ];
      const present = state.future[index];
      const future = state.future.slice(index + 1);
      return {
        historyIndex,
        past,
        present,
        future,
      }
    }
    // // Load workspace should clear history
    // case UPDATE_WORKSPACE: {
    //   const { query } = <UpdateWorkspaceAction>action;
    //   if (!query.voxels) return state;

    //   return {
    //     historyIndex: state.historyIndex + 1,
    //     past: [],
    //     present: {
    //       historyIndex: state.historyIndex + 1,
    //       action: action.type,
    //       data: Immutable.Map<string, Voxel>(query.voxels),
    //     },
    //     future: [],
    //   };
    // }
    default: {
      // Delegate handling the action to the passed reducer
      const data = reducer(state.present.data, action)
      if (state.present.data === data) {
        return state;
      }

      const historyIndex = state.historyIndex + 1;

      const past = (
        state.past.length < MAX_HISTORY_LEN - 1
          ? state.past
          : state.past.slice(state.past.length - MAX_HISTORY_LEN + 2)
      ).concat(state.present);

      const present: VoxelSnapshot = {
        historyIndex,
        action: action.type,
        data,
      };

      return {
        historyIndex,
        past,
        present,
        future: [],
      }
    }
  }
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

export default voxelUndoable(mesh(matrixReducer));
