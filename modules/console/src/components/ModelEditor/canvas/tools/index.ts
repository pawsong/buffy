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
import LineTool2d from './LineTool/LineTool2d';
import LineTool3d from './LineTool/LineTool3d';
import RectangleTool2d from './RectangleTool/RectangleTool2d';
import RectangleTool3d from './RectangleTool/RectangleTool3d';
import ColorizeTool2d from './ColorizeTool/ColorizeTool2d';
import ColorizeTool3d from './ColorizeTool/ColorizeTool3d';
import EraseTool from './EraseTool';
import BoxTool from './BoxTool';
import BoxSelectTool from './BoxSelectTool';
import RectangleSelectTool2d from './RectangleSelectTool/RectangleSelectTool2d';
import RectangleSelectTool3d from './RectangleSelectTool/RectangleSelectTool3d';
import MagicWandTool2d from './MagicWandTool/MagicWandTool2d';
import MagicWandTool3d from './MagicWandTool/MagicWandTool3d';
import ColorFillTool2d from './ColorFillTool/ColorFillTool2d';
import ColorFillTool3d from './ColorFillTool/ColorFillTool3d';
import MoveTool2d from './MoveTool/MoveTool2d';
import MoveTool3d from './MoveTool/MoveTool3d';
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
    case ToolType.LINE_2D: {
      return new LineTool2d(initParams);
    }
    case ToolType.LINE_3D: {
      return new LineTool3d(initParams);
    }
    case ToolType.RECTANGLE_2D: {
      return new RectangleTool2d(initParams);
    }
    case ToolType.RECTANGLE_3D: {
      return new RectangleTool3d(initParams);
    }
    case ToolType.COLORIZE_2D: {
      return new ColorizeTool2d(initParams);
    }
    case ToolType.COLORIZE_3D: {
      return new ColorizeTool3d(initParams);
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
    case ToolType.RECTANGLE_SELECT_2D: {
      return new RectangleSelectTool2d(initParams);
    }
    case ToolType.RECTANGLE_SELECT_3D: {
      return new RectangleSelectTool3d(initParams);
    }
    case ToolType.MAGIC_WAND_2D: {
      return new MagicWandTool2d(initParams);
    }
    case ToolType.MAGIC_WAND_3D: {
      return new MagicWandTool3d(initParams);
    }
    case ToolType.COLOR_FILL_2D: {
      return new ColorFillTool2d(initParams);
    }
    case ToolType.COLOR_FILL_3D: {
      return new ColorFillTool3d(initParams);
    }
    case ToolType.MOVE_2D: {
      return new MoveTool2d(initParams);
    }
    case ToolType.MOVE_3D: {
      return new MoveTool3d(initParams);
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
