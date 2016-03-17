import StateLayer from '@pasta/core/lib/StateLayer';

import update from '../utils/update';
import { Action } from '../actions';
import {
  SET_WORKSPACE, SetWorkspaceAction,
} from '../actions/codeEditor';

export interface CodeEditorState {
  workspace: any;
}

const initialState: CodeEditorState = {
  workspace: null,
};

export default function zone(state = initialState, action: Action<string>): CodeEditorState {
  switch(action.type) {
    case SET_WORKSPACE: {
      const { workspace } = <SetWorkspaceAction>action;
      return update(state, {
        workspace,
      });
    }
    default: {
      return state;
    }
  }
}
