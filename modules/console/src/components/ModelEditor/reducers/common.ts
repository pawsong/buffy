import {
  CHANGE_TOOL, ChangeToolAction,
  CHANGE_PALETTE_COLOR, ChangePaletteColorAction,
  CHANGE_COLOR_PICKER, ChangeColorPickerAction,
  VOXEL_COPY, VoxelCopyAction,
  CHANGE_PERSPECTIVE, ChangePerspectiveAction,
} from '../actions';

import {
  Action,
  CommonState,
  ToolType,
  Color,
  ColorPickerType,
} from '../types';

import {
  MaterialMapType,
} from '../../../types';

import mapinfo from '../mapinfo';

function rgb(hex: number): Color {
  return {
    r: (hex & 0xff0000) >> 16,
    g: (hex & 0x00ff00) >> 8,
    b: (hex & 0x0000ff),
  };
}

const initialState: CommonState = {
  tool: ToolType.PENCIL,
  colorPicker: ColorPickerType.SIMPLE,
  paletteColors: {
    [MaterialMapType.DEFAULT]: { r: 104, g: 204, b: 202 },
    [MaterialMapType.ALL]: { r: 104, g: 204, b: 202 },
    [MaterialMapType.TROVE_TYPE]: rgb(mapinfo[MaterialMapType.TROVE_TYPE].defaultColor),
    [MaterialMapType.TROVE_ALPHA]: rgb(mapinfo[MaterialMapType.TROVE_ALPHA].defaultColor),
    [MaterialMapType.TROVE_SPECULAR]: rgb(mapinfo[MaterialMapType.TROVE_SPECULAR].defaultColor),
  },
  clipboard: null,
  perspective: false,
}

export default function common(state = initialState, action: Action<any>) {
  switch(action.type) {
    case CHANGE_TOOL: {
      const { tool } = <ChangeToolAction>action;
      return Object.assign({}, state, <CommonState>{
        tool,
      });
    }
    case CHANGE_PALETTE_COLOR: {
      const { mapType, color } = <ChangePaletteColorAction>action;

      // TODO: Normalize denormalized DEFAULT and ALL
      const colors = mapType === MaterialMapType.DEFAULT || mapType === MaterialMapType.ALL
        ? {
          [MaterialMapType.DEFAULT]: color,
          [MaterialMapType.ALL]: color,
        } : {
          [mapType]: color,
        };

      return Object.assign({}, state, <CommonState>{
        paletteColors: Object.assign({}, state.paletteColors, colors),
      });
    }
    case CHANGE_COLOR_PICKER: {
      const { colorPicker } = <ChangeColorPickerAction>action;
      if (colorPicker === state.colorPicker) return state;

      return Object.assign({}, state, <CommonState>{
        colorPicker,
      });
    }
    case VOXEL_COPY: {
      const { maps, selection } = <VoxelCopyAction>action;
      return Object.assign({}, state, <CommonState>{
        clipboard: { maps, selection },
      });
    }
    case CHANGE_PERSPECTIVE: {
      const { perspective } = <ChangePerspectiveAction>action;
      return Object.assign({}, state, <CommonState>{
        perspective,
      });
    }
  }

  return state;
}
