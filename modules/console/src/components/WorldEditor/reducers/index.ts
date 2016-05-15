import { WorldEditorState } from '../types';

import { Action } from '../actions';
import { commonReducer } from './common';
import { editModeReducer } from './editMode';
import { playModeReducer } from './playMode';

export function rootReducer(state: WorldEditorState, action: Action<any>): WorldEditorState {
  return {
    common: commonReducer(state.common, action),
    editMode: editModeReducer(state.editMode, action),
    playMode: playModeReducer(state.playMode, action),
  };
}
