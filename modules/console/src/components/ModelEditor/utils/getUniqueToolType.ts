const invariant = require('fbjs/lib/invariant');

import {
  ToolType,
  UniqueToolType,
} from '../types';

function getUniqueToolType(mode2d: boolean, toolType: ToolType): UniqueToolType {
  switch(toolType) {
    case ToolType.TRANSFORM: {
      return UniqueToolType.TRANSFORM;
    }
    case ToolType.RESIZE: {
      return UniqueToolType.RESIZE;
    }
  }

  if (mode2d) {
    switch(toolType) {
      case ToolType.MOVE: {
        return UniqueToolType.MOVE_2D;
      }
      case ToolType.RECTANGLE_SELECT: {
        return UniqueToolType.RECTANGLE_SELECT_2D;
      }
      case ToolType.MAGIC_WAND: {
        return UniqueToolType.MAGIC_WAND_2D;
      }
      case ToolType.PENCIL: {
        return UniqueToolType.PENCIL_2D;
      }
      case ToolType.ERASE: {
        return UniqueToolType.ERASE_2D;
      }
      case ToolType.PAINT: {
        return UniqueToolType.PAINT_2D;
      }
      case ToolType.COLOR_FILL: {
        return UniqueToolType.COLOR_FILL_2D;
      }
      case ToolType.LINE: {
        return UniqueToolType.LINE_2D;
      }
      case ToolType.RECTANGLE: {
        return UniqueToolType.RECTANGLE_2D;
      }
      case ToolType.COLORIZE: {
        return UniqueToolType.COLORIZE_2D;
      }
    }
  } else {
    switch(toolType) {
      case ToolType.MOVE: {
        return UniqueToolType.MOVE_3D;
      }
      case ToolType.RECTANGLE_SELECT: {
        return UniqueToolType.RECTANGLE_SELECT_3D;
      }
      case ToolType.MAGIC_WAND: {
        return UniqueToolType.MAGIC_WAND_3D;
      }
      case ToolType.PENCIL: {
        return UniqueToolType.PENCIL_3D;
      }
      case ToolType.ERASE: {
        return UniqueToolType.ERASE_3D;
      }
      case ToolType.PAINT: {
        return UniqueToolType.PAINT_3D;
      }
      case ToolType.COLOR_FILL: {
        return UniqueToolType.COLOR_FILL_3D;
      }
      case ToolType.LINE: {
        return UniqueToolType.LINE_3D;
      }
      case ToolType.RECTANGLE: {
        return UniqueToolType.RECTANGLE_3D;
      }
      case ToolType.COLORIZE: {
        return UniqueToolType.COLORIZE_3D;
      }
      case ToolType.BOX: {
        return UniqueToolType.BOX;
      }
      case ToolType.BOX_SELECT: {
        return UniqueToolType.BOX_SELECT;
      }
    }
  }

  invariant(false, `invariant tool: ${mode2d}/${toolType}`);
}

export default getUniqueToolType;
