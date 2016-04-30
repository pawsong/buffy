import {
  ToolType,
  DispatchAction,
  GetEditorState,
} from '../../interface';

import View from '../views/main';

import VoxelEditorTool from './VoxelEditorTool';

import BrushTool from './BrushTool';
import ColorPickerTool from './ColorPickerTool';
import EraseTool from './EraseTool';

export default function createTool(
  toolType: ToolType,
  view: View,
  getState: GetEditorState,
  setState: any,
  dispatchAction: DispatchAction
): VoxelEditorTool {
  switch(toolType) {
    case ToolType.brush: {
      return new BrushTool({ view, setState, dispatchAction }, getState);
    }
    case ToolType.colorize: {
      return new ColorPickerTool({ view, setState, dispatchAction } , getState);
    }
    case ToolType.erase: {
      return new EraseTool({ view, setState, dispatchAction }, getState);
    }
  }

  throw new Error(`Invalid tool type: ${ToolType[toolType]}`);
}
