const combineReducers = require('redux/lib/combineReducers').default;

import { WorldEditorState } from '../../types';

import { Action } from '../../actions';
import { commonReducer } from './common';
import { editModeReducer } from './editMode';
import { playModeReducer } from './playMode';

export default combineReducers({
  common: commonReducer,
  editMode: editModeReducer,
  playMode: playModeReducer,
});
