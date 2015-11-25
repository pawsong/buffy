import { SET_WORKSPACE, LOAD_WORKSPACE } from '../constants/ActionTypes';

export function setWorkspace(workspace) {
  return { type: SET_WORKSPACE, workspace };
}

export function loadWorkspace({ voxels, sprites }) {
  return { type: LOAD_WORKSPACE, voxels, sprites };
}
