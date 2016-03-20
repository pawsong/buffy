import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import auth, { AuthState } from './auth';
import codeEditor, { CodeEditorState } from './codeEditor';
import course, { CourseState, initialize as courseInit } from './course';
import game, { GameState, initialize as gameInit } from './game';
import snackbar, { SnackbarState } from './snackbar';
import users, { UsersState, initialize as usersInit } from './users';
import voxelEditor, { VoxelEditorState, initialize as voxelEditorInit } from './voxelEditor';
import zone, { ZoneState } from './zone';

import api, { ApiState, initialize as apiInit } from '../api/reducer';

export interface State {
  auth: AuthState;
  codeEditor: CodeEditorState;
  course: CourseState;
  game: GameState;
  snackbar: SnackbarState;
  users: UsersState;
  voxelEditor: VoxelEditorState;
  zone: ZoneState;
  api: ApiState;
}

export const initialize = {
  course: courseInit,
  game: gameInit,
  users: usersInit,
  voxelEditor: voxelEditorInit,
  api: apiInit,
};

export default combineReducers({
  auth,
  codeEditor,
  course,
  game,
  snackbar,
  users,
  voxelEditor,
  zone,
  api,
  routing: routerReducer,
});
