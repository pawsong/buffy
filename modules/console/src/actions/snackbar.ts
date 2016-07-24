import { Action } from './';

import { SnackbarRequest } from '../reducers/snackbar';

export const SHOW_SNACKBAR: 'snackbar/SHOW_SNACKBAR' = 'snackbar/SHOW_SNACKBAR';
export interface ShowSnackbarAction extends Action<typeof SHOW_SNACKBAR> {
  open: boolean;
}
export function showSnackback(open: boolean): ShowSnackbarAction {
  return {
    type: SHOW_SNACKBAR,
    open,
  };
}

// export const UPDATE_SNACKBAR: 'snackbar/UPDATE_SNACKBAR' = 'snackbar/UPDATE_SNACKBAR';
// export interface UpdateSnackbarQuery extends ShowSnackbarQuery {
//   open?: boolean;
// }
// export interface UpdateSnackbarAction extends Action<typeof UPDATE_SNACKBAR> {
//   query: UpdateSnackbarQuery;
// }
// export function updateSnackbar(query: UpdateSnackbarQuery): UpdateSnackbarAction {
//   return {
//     type: UPDATE_SNACKBAR,
//     query: query,
//   };
// }

export const PUSH_SNACKBAR: 'snackbar/PUSH_SNACKBAR' = 'snackbar/PUSH_SNACKBAR';
export interface PushSnackbarAction extends Action<typeof PUSH_SNACKBAR> {
  query: SnackbarRequest;
}
export function pushSnackbar(query: SnackbarRequest): PushSnackbarAction {
  return {
    type: PUSH_SNACKBAR,
    query: query,
  };
}

export const POP_SNACKBAR: 'snackbar/POP_SNACKBAR' = 'snackbar/POP_SNACKBAR';
export function popSnackbar() {
  return {
    type: POP_SNACKBAR,
  };
}

export const CLOSE_SNACKBAR: 'snackbar/CLOSE_SNACKBAR' = 'snackbar/CLOSE_SNACKBAR';
export function closeSnackbar() {
  return {
    type: CLOSE_SNACKBAR,
  };
}
