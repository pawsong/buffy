import {
  CHANGE_TOOL, ChangeToolAction,
  CHANGE_PALETTE_COLOR, ChangePaletteColorAction,
} from '../actions';

import {
  Action,
  CommonState,
  ToolType,
  Color,
} from '../types';

const initialState: CommonState = {
  selectedTool: ToolType.TRANSFORM,
  paletteColor: { r: 104, g: 204, b: 202 },
}

export default function common(state = initialState, action: Action<any>) {
  switch(action.type) {
    case CHANGE_TOOL: {
      const { tool: selectedTool } = <ChangeToolAction>action;
      return Object.assign({}, state, { selectedTool });
    }
    case CHANGE_PALETTE_COLOR: {
      const { color: paletteColor } = <ChangePaletteColorAction>action;
      return Object.assign({}, state, { paletteColor });
    }
  }

  return state;
}
