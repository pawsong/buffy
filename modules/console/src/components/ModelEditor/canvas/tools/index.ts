import {
  ToolType,
  DispatchAction,
  GetEditorState,
} from '../../types';

import ModelEditorCanvas from '../ModelEditorCanvas';

import ModelEditorTool from './ModelEditorTool';

import BrushTool from './BrushTool';
import ColorizeTool from './ColorizeTool';
import EraseTool from './EraseTool';

export default function createTool(
  toolType: ToolType,
  canvas: ModelEditorCanvas,
  dispatchAction: DispatchAction
): ModelEditorTool<any> {
  const initParams = {
    canvas, dispatchAction,
  };

  switch(toolType) {
    case ToolType.brush: {
      return new BrushTool(initParams);
    }
    case ToolType.colorize: {
      return new ColorizeTool(initParams);
    }
    case ToolType.erase: {
      return new EraseTool(initParams);
    }
  }

  throw new Error(`Invalid tool type: ${ToolType[toolType]}`);
}
