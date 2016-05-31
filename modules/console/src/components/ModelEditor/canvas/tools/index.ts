import {
  ToolType,
  DispatchAction,
  GetEditorState,
} from '../../types';

import ModelEditorCanvas from '../ModelEditorCanvas';

import ModelEditorTool from './ModelEditorTool';

import BrushTool from './BrushTool';
import RectangleTool from './RectangleTool';
import ColorizeTool from './ColorizeTool';
import EraseTool from './EraseTool';
import BoxTool from './BoxTool';
import BoxSelectTool from './BoxSelectTool';
import RectangleSelectTool from './RectangleSelectTool';
import MagicWandTool from './MagicWandTool';
import MoveTool from './MoveTool';

export default function createTool(
  toolType: ToolType,
  canvas: ModelEditorCanvas,
  dispatchAction: DispatchAction
): ModelEditorTool<any, any, any> {
  const initParams = {
    canvas, dispatchAction,
  };

  switch(toolType) {
    case ToolType.BRUSH: {
      return new BrushTool(initParams);
    }
    case ToolType.RECTANGLE: {
      return new RectangleTool(initParams);
    }
    case ToolType.COLORIZE: {
      return new ColorizeTool(initParams);
    }
    case ToolType.ERASE: {
      return new EraseTool(initParams);
    }
    case ToolType.BOX: {
      return new BoxTool(initParams);
    }
    case ToolType.BOX_SELECT: {
      return new BoxSelectTool(initParams);
    }
    case ToolType.RECTANGLE_SELECT: {
      return new RectangleSelectTool(initParams);
    }
    case ToolType.MAGIC_WAND: {
      return new MagicWandTool(initParams);
    }
    case ToolType.MOVE: {
      return new MoveTool(initParams);
    }
  }

  throw new Error(`Invalid tool type: ${ToolType[toolType]}`);
}
