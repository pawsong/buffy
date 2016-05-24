const objectAssign = require('object-assign');

import {
  EditorMode,
  PlayModeState,
  PlayState,
  PlayToolType,
  ViewMode,
} from '../../types';

import {
  Action,
  CHANGE_EDITOR_MODE, ChangeEditorModeAction,
  CHANGE_PLAY_TOOL, ChangePlayToolAction,
  CHANGE_PLAY_VIEW_MODE, ChangePlayViewModeAction,
  CHANGE_PLAY_STATE, ChangePlayStateAction,
} from '../../actions';

const initialState: PlayModeState = {
  state: PlayState.READY,
  tool: PlayToolType.MOVE,
  viewMode: ViewMode.BIRDS_EYE,
}

export function playModeReducer(state = initialState, action: Action<any>): PlayModeState {
  switch(action.type) {
    case CHANGE_EDITOR_MODE: {
      const { mode } = <ChangeEditorModeAction>action;
      if (mode !== EditorMode.PLAY) return state;
      return objectAssign({}, state, { state: PlayState.READY });
    }
    case CHANGE_PLAY_TOOL: {
      const { tool } = <ChangePlayToolAction>action;
      return objectAssign({}, state, { tool });
    }
    case CHANGE_PLAY_VIEW_MODE: {
      const { viewMode } = <ChangePlayViewModeAction>action;
      return objectAssign({}, state, { viewMode });
    }
    case CHANGE_PLAY_STATE: {
      const { playState } = <ChangePlayStateAction>action;
      return objectAssign({}, state, { state: playState });
    }
  }
  return state;
}
