import { Keyboard } from '../../../../keyboard';

import {
  ToolType,
  DispatchAction,
  GetEditorState,
} from '../../types';

import ModelEditorCanvas from '../ModelEditorCanvas';

import ModelEditorTool from './ModelEditorTool';

import PencilTool from './PencilTool';
import PaintTool from './PaintTool';
import LineTool from './LineTool';
import RectangleTool from './RectangleTool';
import ColorizeTool from './ColorizeTool';
import EraseTool from './EraseTool';
import BoxTool from './BoxTool';
import BoxSelectTool from './BoxSelectTool';
import RectangleSelectTool from './RectangleSelectTool';
import MagicWandTool from './MagicWandTool';
import ColorFillTool from './ColorFillTool';
import MoveTool from './MoveTool';
import ResizeTool from './ResizeTool';
import TransformTool from './TransformTool';

export default function createTool(
  toolType: ToolType,
  canvas: ModelEditorCanvas,
  dispatchAction: DispatchAction,
  keyboard: Keyboard
): ModelEditorTool<any, any, any> {
  const initParams = {
    canvas, dispatchAction, keyboard,
  };

  switch(toolType) {
    case ToolType.PENCIL: {
      return new PencilTool(initParams);
    }
    case ToolType.PAINT: {
      return new PaintTool(initParams);
    }
    case ToolType.LINE: {
      return new LineTool(initParams);
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
    case ToolType.COLOR_FILL: {
      return new ColorFillTool(initParams);
    }
    case ToolType.MOVE: {
      return new MoveTool(initParams);
    }
    case ToolType.RESIZE: {
      return new ResizeTool(initParams);
    }
    case ToolType.TRANSFORM: {
      return new TransformTool(initParams);
    }
  }

  throw new Error(`Invalid tool type: ${ToolType[toolType]}`);
}
