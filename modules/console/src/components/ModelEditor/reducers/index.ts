const combineReducers = require('redux/lib/combineReducers').default;

import {
  Action,
  ModelEditorState,
} from '../types';

import common from './common';
import voxel from './voxel';

interface RootReducer {
  (state: ModelEditorState, action: Action<any>): ModelEditorState;
}

export default <RootReducer>combineReducers({
  common,
  voxel,
});
