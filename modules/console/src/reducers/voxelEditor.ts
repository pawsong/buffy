import * as Immutable from 'immutable';
import update = require('react-addons-update');
import pagenate from './paginate';

import {
  SET_COLOR, SetColorAction,
  CHANGE_TOOL, ChangeToolAction,
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
  SHOW_NOT_IMPL_DIALOG, ShowNotImplDialogAction,
  UPDATE_WORKSPACE, UpdateWorkspaceAction,
  UPDATE_WORKSPACE_BROWSER, UpdateWorkspaceBrowserAction,
  UPDATE_SAVE_DIALOG, UpdateSaveDialogAction,
} from '../actions/voxelEditor';

import {
  GRID_SIZE,
} from '../constants/Pixels';

import { Action } from '../actions';

import objectAssign = require('object-assign');
const findIndex = require('lodash/findIndex');
import vector3ToString from '@pasta/helper/lib/vector3ToString';

export interface Color {
  r: number; g: number; b: number;
}

interface PaletteState {
  color: Color;
}

export type ToolType = 'BRUSH' | 'ERASE' | 'COLORIZE';

interface ToolState {
  type: ToolType;
}

export interface Position {
  x: number; y: number; z: number;
}

export interface Voxel {
  position: Position;
  color: Color;
}

type Voxels = Immutable.Map<string, Voxel>;

interface VoxelSnapshot {
  historyIndex: number;
  action: string;
  data: Voxels;
}

export interface VoxelState {
  historyIndex: number;
  past: VoxelSnapshot[];
  present: VoxelSnapshot;
  future: VoxelSnapshot[];
}

export interface WorkspaceState {
  name: string;
}

interface UiState {
  notImplDialogOpened: boolean;
  workspaceBrowserDialog: {
    open: boolean;
    page: number;
  },
  saveDialog: {
    open: boolean;
  },
}

export interface VoxelEditorState {
  palette: PaletteState;
  tool: ToolState;
  voxel: VoxelState;
  workspace: WorkspaceState;
  ui: UiState;
}

function palette(state, action: Action<any>): PaletteState {
  switch (action.type) {
    case SET_COLOR: {
      const { color } = <SetColorAction>action;
      return update(state, {
        color: { $set: { r: color.r, g: color.g, b: color.b } }
      });
    }
    default: {
      return state;
    }
  }
}

export function tool(state, action: Action<any>): ToolState {
  switch (action.type) {
    case CHANGE_TOOL: {
      const { toolType } = <ChangeToolAction>action;
      return update(state, {
        type: { $set: toolType },
      });
    }
    default: {
      return state;
    }
  }
}

const MAX_HISTORY_LEN = 20;

const voxelUndoable = reducer => (state: VoxelState, action: Action<any>): VoxelState => {
  switch (action.type) {
    case VOXEL_UNDO: {
      const previous = state.past[state.past.length - 1]
      const newPast = state.past.slice(0, state.past.length - 1)
      return {
        historyIndex: state.historyIndex,
        past: newPast,
        present: previous,
        future: [ state.present, ...state.future ]
      }
    }
    case VOXEL_UNDO_SEEK: {
      const { historyIndex } = <VoxelUndoSeekAction>action;
      const index = findIndex(state.past, item => {
        return item.historyIndex === historyIndex;
      })
      const previous = state.past[index];
      const newPast = state.past.slice(0, index);
      const newFuture = [
        ...state.past.slice(index + 1),
        state.present,
        ...state.future,
      ];
      return {
        historyIndex,
        past: newPast,
        present: previous,
        future: newFuture,
      }
    }
    case VOXEL_REDO: {
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      return {
        historyIndex: state.historyIndex,
        past: [ ...state.past, state.present ],
        present: next,
        future: newFuture
      }
    }
    case VOXEL_REDO_SEEK: {
      const { historyIndex } = <VoxelRedoSeekAction>action;
      const index = findIndex(state.future, item => {
        return item.historyIndex === historyIndex;
      })
      const next = state.future[index];
      const newPast = [
        ...state.past,
        state.present,
        ...state.future.slice(0, index),
      ];
      const newFuture = state.future.slice(index + 1);
      return {
        historyIndex,
        past: newPast,
        present: next,
        future: newFuture
      }
    }
    // Load workspace should clear history
    case UPDATE_WORKSPACE: {
      const { query } = <UpdateWorkspaceAction>action;
      if (!query.voxels) return state;

      return {
        historyIndex: state.historyIndex + 1,
        past: [],
        present: {
          historyIndex: state.historyIndex + 1,
          action: action.type,
          data: Immutable.Map<string, Voxel>(query.voxels),
        },
        future: [],
      };
    }
    default: {
      // Delegate handling the action to the passed reducer
      const newData = reducer(state.present.data, action)
      if (state.present.data === newData) {
        return state;
      }

      const newPast = (state.past.length < MAX_HISTORY_LEN - 1 ? state.past :
                        state.past.slice(state.past.length - MAX_HISTORY_LEN + 2)).concat(state.present);
      return {
        historyIndex: state.historyIndex + 1,
        past: newPast,
        present: {
          historyIndex: state.historyIndex + 1,
          action: action.type,
          data: newData,
        },
        future: []
      }
    }
  }
};

const rotates = {
  x: pos => ({ x: pos.x, y: GRID_SIZE + 1 - pos.z, z: pos.y }),
  y: pos => ({ x: pos.z, y: pos.y, z: GRID_SIZE + 1 - pos.x }),
  z: pos => ({ x: GRID_SIZE + 1 - pos.y, y: pos.x, z: pos.z }),
};

export const voxel = voxelUndoable((state: Voxels, action: Action<any>): Voxels => {
  switch (action.type) {
    case VOXEL_ADD: {
      const { position, color } = <VoxelAddAction>action;
      return state.set(vector3ToString(position), {
        position, color
      });
    }
    case VOXEL_ADD_BATCH: {
      const { voxels } = <VoxelAddBatchAction>action;
      return state.withMutations(map => {
        voxels.forEach(voxel => {
          const { position, color } = voxel;
          map.set(vector3ToString(position), {
            position, color
          });
        });
      });
    }
    case VOXEL_REMOVE: {
      const { position } = <VoxelRemoveAction>action;
      return state.remove(vector3ToString(position));
    }
    case VOXEL_REMOVE_BATCH: {
      const { positions } = <VoxelRemoveBatchAction>action;
      return state.withMutations(map => {
        positions.forEach(position => {
          map.remove(vector3ToString(position));
        });
      });
    }
    case VOXEL_ROTATE: {
      const { axis } = <VoxelRotateAction>action;
      const rotate = rotates[axis] || (pos => pos);
      return Immutable.Map<string, any>().withMutations(map => {
        state.forEach(voxel => {
          const position = rotate(voxel.position);
          map.set(vector3ToString(position), {
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

function workspace(state: WorkspaceState, action: Action<any>): WorkspaceState {
  switch (action.type) {
    case UPDATE_WORKSPACE: {
      const { query } = <UpdateWorkspaceAction>(action);
      return update(state, { name: { $set: query.name } });
    }
    default: {
      return state;
    }
  }
}

function ui(state: UiState, action: Action<any>): UiState {
  switch(action.type) {
    case UPDATE_WORKSPACE_BROWSER: {
      const { query } = <UpdateWorkspaceBrowserAction>action;
      return update(state, {
        workspaceBrowserDialog: { $merge: query },
      });
    }
    case UPDATE_SAVE_DIALOG: {
      const { query } = <UpdateSaveDialogAction>action;
      return update(state, {
        saveDialog: { $merge: query },
      });
    }
    case SHOW_NOT_IMPL_DIALOG: {
      const { show } = <ShowNotImplDialogAction>action;
      return update(state, {
        notImplDialogOpened: { $set: show },
      });
    }
    default: {
      return state;
    }
  }
}

const initialState: VoxelEditorState = {
  palette: {
    color: { r: 46, g: 204, b: 113 },
  },
  tool: {
    type: 'BRUSH',
  },
  voxel: {
    historyIndex: 1,
    past: [],
    present: {
      historyIndex: 1,
      action: VOXEL_INIT,
      data: Immutable.Map<string, Voxel>(),
    },
    future: []
  },
  workspace: {
    name: '',
  },
  ui: {
    workspaceBrowserDialog: {
      open: false,
      page: 1,
    },
    saveDialog: {
      open: false,
    },
    notImplDialogOpened: false,
  },
}

export function initialize(state): VoxelEditorState {
  return update(state, {
    voxel: {
      present: {
        data: { $set: Immutable.Map<string, Voxel>(state ? state.voxel.present.data : {}) },
      },
    },
  });
}

export default function voxelEditor(state = initialState, action: Action<any>): VoxelEditorState {
  return {
    palette: palette(state.palette, action),
    tool: tool(state.tool, action),
    voxel: voxel(state.voxel, action),
    workspace: workspace(state.workspace, action),
    ui: ui(state.ui, action),
  };
}
