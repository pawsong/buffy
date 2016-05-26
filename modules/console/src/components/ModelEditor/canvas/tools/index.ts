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
import MagicWandTool from './MagicWandTool';

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
    case ToolType.rectangle: {
      return new RectangleTool(initParams);
    }
    case ToolType.colorize: {
      return new ColorizeTool(initParams);
    }
    case ToolType.erase: {
      return new EraseTool(initParams);
    }
    case ToolType.box: {
      return new BoxTool(initParams);
    }
    case ToolType.BOX_SELECT: {
      return new BoxSelectTool(initParams);
    }
    case ToolType.MAGIC_WAND: {
      return new MagicWandTool(initParams);
    }
  }

  throw new Error(`Invalid tool type: ${ToolType[toolType]}`);
}
