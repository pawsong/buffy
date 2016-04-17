import { combineReducers } from 'redux';
import { routerReducer } from 'react-router-redux';

import auth, { AuthState } from './auth';
import course, { CourseState, initialize as courseInit } from './course';
import game, { GameState, initialize as gameInit } from './game';
import snackbar, { SnackbarState } from './snackbar';
import users, { UsersState, initialize as usersInit } from './users';
import voxelEditor, { VoxelEditorState, initialize as voxelEditorInit } from './voxelEditor';
import zone, { ZoneState } from './zone';
import loading from './loading';

import api, { ApiState, initialize as apiInit } from '../api/reducer';

export interface State {
  auth: AuthState;
  course: CourseState;
  game: GameState;
  snackbar: SnackbarState;
  users: UsersState;
  voxelEditor: VoxelEditorState;
  zone: ZoneState;
  loading: boolean;
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
  course,
  game,
  snackbar,
  users,
  voxelEditor,
  zone,
  loading,
  api,
  routing: routerReducer,
});
