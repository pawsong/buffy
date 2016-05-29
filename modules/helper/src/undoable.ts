const DEFAULT_MAX_HISTORY_LEN = 20;

export interface Action<T> {
  type: T;
}

export const INIT: 'undoable/INIT' = 'undoable/INIT';

export const UNDO: 'undoable/UNDO' = 'undoable/UNDO';
export interface UndoAction extends Action<typeof UNDO> {
}
export function undo(): UndoAction {
  return {
    type: UNDO,
  };
};

export const UNDO_SEEK: 'undoable/UNDO_SEEK' = 'undoable/UNDO_SEEK';
export interface UndoSeekAction extends Action<typeof UNDO_SEEK> {
  historyIndex: number
}
export function undoSeek(historyIndex): UndoSeekAction {
  return {
    type: UNDO_SEEK,
    historyIndex,
  };
};

export const REDO: 'undoable/REDO' = 'undoable/REDO';
export interface RedoAction extends Action<typeof REDO> {
}
export function redo() {
  return {
    type: REDO,
  };
}

export const REDO_SEEK: 'undoable/REDO_SEEK' = 'undoable/REDO_SEEK';
export interface RedoSeekAction extends Action<typeof REDO_SEEK> {
  historyIndex: number;
}
export function redoSeek(historyIndex: number) {
  return {
    type: REDO_SEEK,
    historyIndex,
  };
}

export const RESET: 'undoable/RESET' = 'undoable/RESET';
export interface ResetAction extends Action<typeof RESET> {
  data: any;
}
export function reset(data: any): ResetAction {
  return {
    type: RESET,
    data,
  };
}

export interface Snapshot<T> {
  historyIndex: number;
  action: string;
  data: T;
}

export interface UndoableState<T> {
  historyIndex: number;
  past: Snapshot<T>[];
  present: Snapshot<T>;
  future: Snapshot<T>[];
}

export interface Reducer<T> {
  (state: T, action: Action<any>): T;
}

export interface UndoableOptions {
  maxHistoryLength?: number;
}

export function createState<T>(initialState: T): UndoableState<T> {
  return {
    historyIndex: 1,
    past: [],
    present: {
      historyIndex: 1,
      action: INIT,
      data: initialState,
    },
    future: [],
  };
}

export default function undoable<T>(reducer: Reducer<T>, options: UndoableOptions = {}) {
  const maxHistoryLength = options.maxHistoryLength || DEFAULT_MAX_HISTORY_LEN;

  const initialState: UndoableState<any> = createState(reducer(undefined, { type: INIT }));

  return function (state = initialState, action: Action<any>): UndoableState<T> {
    switch (action.type) {
      case UNDO: {
        if (state.past.length === 0) return state;

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
      case UNDO_SEEK: {
        const { historyIndex } = <UndoSeekAction>action;

        let index = -1;
        for (let i = 0, len = state.past.length; i < len; ++i) {
          if (state.past[i].historyIndex === historyIndex) {
            index = i;
            break;
          }
        }
        if (index === -1) return state;

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
      case REDO: {
        if (state.future.length === 0) return state;

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
      case REDO_SEEK: {
        const { historyIndex } = <RedoSeekAction>action;

        let index = -1;
        for (let i = 0, len = state.future.length; i < len; ++i) {
          if (state.future[i].historyIndex === historyIndex) {
            index = i;
            break;
          }
        }
        if (index === -1) return state;

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
      case RESET: {
        const { data } = <ResetAction>action;
        return {
          historyIndex: state.historyIndex + 1,
          past: [],
          present: {
            historyIndex: state.historyIndex + 1,
            action: action.type,
            data,
          },
          future: [],
        };
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
          state.past.length < maxHistoryLength - 1
            ? state.past
            : state.past.slice(state.past.length - maxHistoryLength + 2)
        ).concat(state.present);

        const present = {
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
};
