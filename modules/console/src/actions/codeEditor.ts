import { Action } from './';

export const SET_WORKSPACE: 'code-editor/SET_WORKSPACE' = 'code-editor/SET_WORKSPACE';
export interface SetWorkspaceAction extends Action<typeof SET_WORKSPACE> {
  workspace: any;
}
export function setWorkspace(workspace: any): SetWorkspaceAction {
  return {
    type: SET_WORKSPACE,
    workspace,
  };
}

export const REQUEST_RUN_BLOCKLY: 'code-editor/REQUEST_RUN_BLOCKLY' = 'code-editor/REQUEST_RUN_BLOCKLY';
export interface RequestRunBlocklyAction extends Action<typeof REQUEST_RUN_BLOCKLY> {
  workspace: any;
}
export function requestRunBlockly(workspace: any): RequestRunBlocklyAction  {
  return {
    type: REQUEST_RUN_BLOCKLY,
    workspace,
  };
}
