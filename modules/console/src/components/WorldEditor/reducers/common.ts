import {
  CommonState,
} from '../types';

import {
  Action,
  CHANGE_EDITOR_MODE,
  ChangeEditorModeAction,
} from '../actions';

export function commonReducer(state: CommonState, action: Action<any>): CommonState {
  switch (action.type) {
    case CHANGE_EDITOR_MODE: {
      const { mode } = <ChangeEditorModeAction>action;
      return {
        fileId: state.fileId,
        mode,
      };
    }
  }
  return state;
}
