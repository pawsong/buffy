import { Keyboard } from '../../../../keyboard';

import {
  UniqueToolType,
  DispatchAction,
  GetEditorState,
} from '../../types';

import getUniqueToolType from '../../utils/getUniqueToolType';

import ModelEditorCanvas from '../ModelEditorCanvas';

import ModelEditorTool from './ModelEditorTool';

import MoveTool2d from './MoveTool/MoveTool2d';
import MoveTool3d from './MoveTool/MoveTool3d';
import RectangleSelectTool2d from './RectangleSelectTool/RectangleSelectTool2d';
import RectangleSelectTool3d from './RectangleSelectTool/RectangleSelectTool3d';
import MagicWandTool2d from './MagicWandTool/MagicWandTool2d';
import MagicWandTool3d from './MagicWandTool/MagicWandTool3d';
import PencilTool2d from './PencilTool/PencilTool2d';
import PencilTool3d from './PencilTool/PencilTool3d';
import EraseTool2d from './EraseTool/EraseTool2d';
import EraseTool3d from './EraseTool/EraseTool3d';
import PaintTool2d from './PaintTool/PaintTool2d';
import PaintTool3d from './PaintTool/PaintTool3d';
import ColorFillTool2d from './ColorFillTool/ColorFillTool2d';
import ColorFillTool3d from './ColorFillTool/ColorFillTool3d';
import LineTool2d from './LineTool/LineTool2d';
import LineTool3d from './LineTool/LineTool3d';
import RectangleTool2d from './RectangleTool/RectangleTool2d';
import RectangleTool3d from './RectangleTool/RectangleTool3d';
import ColorizeTool2d from './ColorizeTool/ColorizeTool2d';
import ColorizeTool3d from './ColorizeTool/ColorizeTool3d';
import BoxTool from './BoxTool';
import BoxSelectTool from './BoxSelectTool';
import TransformTool from './TransformTool';
import ResizeTool from './ResizeTool';

export default function createTool(
  toolType: UniqueToolType,
  canvas: ModelEditorCanvas,
  dispatchAction: DispatchAction,
  keyboard: Keyboard
): ModelEditorTool<any, any, any> {
  const initParams = {
    canvas, dispatchAction, keyboard,
  };

  switch(toolType) {
    case UniqueToolType.TRANSFORM: {
      return new TransformTool(initParams);
    }
    case UniqueToolType.RESIZE: {
      return new ResizeTool(initParams);
    }
    case UniqueToolType.MOVE_2D: {
      return new MoveTool2d(initParams);
    }
    case UniqueToolType.MOVE_3D: {
      return new MoveTool3d(initParams);
    }
    case UniqueToolType.RECTANGLE_SELECT_2D: {
      return new RectangleSelectTool2d(initParams);
    }
    case UniqueToolType.RECTANGLE_SELECT_3D: {
      return new RectangleSelectTool3d(initParams);
    }
    case UniqueToolType.MAGIC_WAND_2D: {
      return new MagicWandTool2d(initParams);
    }
    case UniqueToolType.MAGIC_WAND_3D: {
      return new MagicWandTool3d(initParams);
    }
    case UniqueToolType.PENCIL_2D: {
      return new PencilTool2d(initParams);
    }
    case UniqueToolType.PENCIL_3D: {
      return new PencilTool3d(initParams);
    }
    case UniqueToolType.ERASE_2D: {
      return new EraseTool2d(initParams);
    }
    case UniqueToolType.ERASE_3D: {
      return new EraseTool3d(initParams);
    }
    case UniqueToolType.PAINT_2D: {
      return new PaintTool2d(initParams);
    }
    case UniqueToolType.PAINT_3D: {
      return new PaintTool3d(initParams);
    }
    case UniqueToolType.COLOR_FILL_2D: {
      return new ColorFillTool2d(initParams);
    }
    case UniqueToolType.COLOR_FILL_3D: {
      return new ColorFillTool3d(initParams);
    }
    case UniqueToolType.LINE_2D: {
      return new LineTool2d(initParams);
    }
    case UniqueToolType.LINE_3D: {
      return new LineTool3d(initParams);
    }
    case UniqueToolType.RECTANGLE_2D: {
      return new RectangleTool2d(initParams);
    }
    case UniqueToolType.RECTANGLE_3D: {
      return new RectangleTool3d(initParams);
    }
    case UniqueToolType.COLORIZE_2D: {
      return new ColorizeTool2d(initParams);
    }
    case UniqueToolType.COLORIZE_3D: {
      return new ColorizeTool3d(initParams);
    }
    case UniqueToolType.BOX: {
      return new BoxTool(initParams);
    }
    case UniqueToolType.BOX_SELECT: {
      return new BoxSelectTool(initParams);
    }
  }

  throw new Error(`Invalid tool type: ${UniqueToolType[toolType]}`);
}
