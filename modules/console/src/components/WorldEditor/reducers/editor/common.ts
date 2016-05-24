import {
  CommonState,
  EditorMode,
} from '../../types';

import {
  Action,
  CHANGE_EDITOR_MODE,
  ChangeEditorModeAction,
} from '../../actions';

const initialState: CommonState = {
  mode: EditorMode.EDIT,
};

export function commonReducer(state = initialState, action: Action<any>): CommonState {
  switch (action.type) {
    case CHANGE_EDITOR_MODE: {
      const { mode } = <ChangeEditorModeAction>action;
      return {
        mode,
      };
    }
  }
  return state;
}
