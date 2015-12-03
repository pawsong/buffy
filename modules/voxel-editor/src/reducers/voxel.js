import * as ActionTypes from '../constants/ActionTypes';
import Immutable from 'immutable';
import _ from 'lodash';

import { vector3ToString } from '@pasta/helper-public';

import {
  GRID_SIZE,
} from '../constants/Pixels';

const MAX_HISTORY_LEN = 20;

function voxelUndoable(reducer) {
  // Call the reducer with empty action to populate the initial state
  const initialState = {
    historyIndex: 1,
    past: [],
    present: {
      historyIndex: 1,
      action: ActionTypes.VOXEL_INIT,
      data: reducer(undefined, {}),
    },
    future: []
  }

  // Return a reducer that handles undo and redo
  return function (state = initialState, action) {
    const { historyIndex, past, present, future } = state

    switch (action.type) {
      case ActionTypes.VOXEL_UNDO:
        {
          const previous = past[past.length - 1]
          const newPast = past.slice(0, past.length - 1)
          return {
            historyIndex,
            past: newPast,
            present: previous,
            future: [ present, ...future ]
          }
        }
      case ActionTypes.VOXEL_UNDO_SEEK:
        {
          const index = _.findIndex(past, item => {
            return item.historyIndex === action.historyIndex;
          })
          const previous = past[index];
          const newPast = past.slice(0, index);
          const newFuture = [
            ...past.slice(index + 1),
            present,
            ...future,
          ];
          return {
            historyIndex,
            past: newPast,
            present: previous,
            future: newFuture,
          }
        }
      case ActionTypes.VOXEL_REDO:
        {
          const next = future[0]
          const newFuture = future.slice(1)
          return {
            historyIndex,
            past: [ ...past, present ],
            present: next,
            future: newFuture
          }
        }
      case ActionTypes.VOXEL_REDO_SEEK:
        {
          const index = _.findIndex(future, item => {
            return item.historyIndex === action.historyIndex;
          })
          const next = future[index];
          const newPast = [
            ...past,
            present,
            ...future.slice(0, index),
          ];
          const newFuture = future.slice(index + 1);
          return {
            historyIndex,
            past: newPast,
            present: next,
            future: newFuture
          }
        }
      // Load workspace should clear history
      case ActionTypes.LOAD_WORKSPACE:
        return {
          historyIndex: historyIndex + 1,
          past: [],
          present: {
            historyIndex: historyIndex + 1,
            action: action.type,
            data: Immutable.Map(action.voxels),
          },
          future: [],
        };
      default:
        // Delegate handling the action to the passed reducer
        const newData = reducer(present.data, action)
        if (present.data === newData) {
          return state;
        }

        const newPast = (past.length < MAX_HISTORY_LEN - 1 ? past :
                         past.slice(past.length - MAX_HISTORY_LEN + 2)).concat(present);
        return {
          historyIndex: historyIndex + 1,
          past: newPast,
          present: {
            historyIndex: historyIndex + 1,
            action: action.type,
            data: newData,
          },
          future: []
        }
    }
  }
}

const rotates = {
  x: pos => ({ x: pos.x, y: GRID_SIZE + 1 - pos.z, z: pos.y }),
  y: pos => ({ x: pos.z, y: pos.y, z: GRID_SIZE + 1 - pos.x }),
  z: pos => ({ x: GRID_SIZE + 1 - pos.y, y: pos.x, z: pos.z }),
};

export const voxel = voxelUndoable(function (state = Immutable.Map(), action) {
  switch (action.type) {
    case ActionTypes.ADD_VOXEL:
      {
        const { position, color } = action;
        return state.set(vector3ToString(position), {
          position, color
        });
      }
    case ActionTypes.ADD_VOXEL_BATCH:
      {
        const { voxels } = action;
        return state.withMutations(map => {
          voxels.forEach(voxel => {
            const { position, color } = voxel;
            map.set(vector3ToString(position), {
              position, color
            });
          });
        });
      }
    case ActionTypes.REMOVE_VOXEL:
      {
        const { position } = action;
        return state.remove(vector3ToString(position));
      }
    case ActionTypes.REMOVE_VOXEL_BATCH:
      {
        const { voxels } = action;
        return state.withMutations(map => {
          voxels.forEach(voxel => {
            const { position } = voxel;
            map.remove(vector3ToString(position));
          });
        });
      }
    case ActionTypes.VOXEL_ROTATE:
      {
        const { axis } = action;
        const rotate = rotates[axis] || (pos => pos);
        return Immutable.Map().withMutations(map => {
          state.forEach(voxel => {
            const position = rotate(voxel.position);
            map.set(vector3ToString(position), {
              position,
              color: voxel.color,
            });
          });
        });
      }
    default:
      return state
  }
});

export function voxelOp(state = {}, action) {
  switch (action.type) {
    case ActionTypes.ADD_VOXEL:
    case ActionTypes.REMOVE_VOXEL:
      return { type: action.type, voxel: action };
    case ActionTypes.ADD_VOXEL_BATCH:
    case ActionTypes.REMOVE_VOXEL_BATCH:
      return { type: action.type, voxels: action.voxels };
    case ActionTypes.VOXEL_UNDO:
    case ActionTypes.VOXEL_UNDO_SEEK:
    case ActionTypes.VOXEL_REDO:
    case ActionTypes.VOXEL_REDO_SEEK:
    case ActionTypes.VOXEL_ROTATE:
    case ActionTypes.LOAD_WORKSPACE:
      return { type: action.type };
    default:
      return state;
  }
}
