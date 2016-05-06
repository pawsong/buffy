import * as Immutable from 'immutable';

import {
  Position,
  Action,
  Voxel,
  Voxels,
  VoxelState,
  VoxelSnapshot,
} from '../interface';

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
} from './actions';

import {
  GRID_SIZE,
} from '../constants/Pixels';

const objectAssign = require('object-assign');
const findIndex = require('lodash/findIndex');
import vector3ToString from '@pasta/helper/lib/vector3ToString';

const MAX_HISTORY_LEN = 20;

export const initialState: VoxelState = {
  historyIndex: 1,
  past: [],
  present: {
    historyIndex: 1,
    action: VOXEL_INIT,
    data: Immutable.Map<any, any>(),
    mesh: { vertices: [], faces: [], gridFaces: [] },
  },
  future: [],
}

import { voxelMapToArray } from '../canvas/utils';
import mesher from '../canvas/meshers/greedy';

const voxelUndoable = reducer => (state: VoxelState = initialState, action: Action<any>): VoxelState => {
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

      const voxelData = voxelMapToArray(data);
      const { vertices, faces, gridFaces } = mesher(voxelData.data, voxelData.shape);

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
        mesh: { vertices, faces, gridFaces },
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

interface RotateFn {
  (position: Position): Position;
}

const rotates: { [index: string]: RotateFn } = {
  x: pos => ([ pos[0],                 GRID_SIZE + 1 - pos[2], pos[1]                 ]),
  y: pos => ([ pos[2],                 pos[1],                 GRID_SIZE + 1 - pos[0] ]),
  z: pos => ([ GRID_SIZE + 1 - pos[1], pos[0],                 pos[2]                 ]),
};

export default voxelUndoable((state: Voxels, action: Action<any>): Voxels => {
  switch (action.type) {
    case VOXEL_ADD_BATCH: {
      const { voxels } = <VoxelAddBatchAction>action;
      console.log(voxels);
      return state.withMutations(map => {
        voxels.forEach(voxel => {
          const { position, color } = voxel;
          map.set(Immutable.Iterable(position), {
            position, color,
          });
        });
      });
    }
    case VOXEL_REMOVE_BATCH: {
      const { positions } = <VoxelRemoveBatchAction>action;
      return state.withMutations(map => {
        positions.forEach(position => {
          map.remove(Immutable.Iterable(position));
        });
      });
    }
    case VOXEL_ROTATE: {
      const { axis } = <VoxelRotateAction>action;
      const rotate = rotates[axis];
      if (!rotate) return state;

      return Immutable.Map<Immutable.Iterable.Indexed<number>, Voxel>().withMutations(map => {
        state.forEach(voxel => {
          const position = rotate(voxel.position);
          map.set(Immutable.Iterable(position), {
            position,
            color: voxel.color,
          });
        });
      });
    }
    default: {
      return state;
    }
  }
});
