import {
  CHANGE_TOOL, ChangeToolAction,
  CHANGE_PALETTE_COLOR, ChangePaletteColorAction,
  VOXEL_COPY, VoxelCopyAction,
} from '../actions';

import {
  Action,
  CommonState,
  ToolType,
  Color,
} from '../types';

const initialState: CommonState = {
  tool: ToolType.PENCIL,
  paletteColor: { r: 104, g: 204, b: 202 },
  clipboard: null,
}

export default function common(state = initialState, action: Action<any>) {
  switch(action.type) {
    case CHANGE_TOOL: {
      const { tool } = <ChangeToolAction>action;
      return Object.assign({}, state, { tool });
    }
    case CHANGE_PALETTE_COLOR: {
      const { color: paletteColor } = <ChangePaletteColorAction>action;
      return Object.assign({}, state, { paletteColor });
    }
    case VOXEL_COPY: {
      const { model, selection } = <VoxelCopyAction>action;
      return Object.assign({}, state, {
        clipboard: { model, selection },
      });
    }
  }

  return state;
}
