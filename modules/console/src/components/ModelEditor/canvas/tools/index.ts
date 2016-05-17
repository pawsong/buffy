import {
  ToolType,
  DispatchAction,
  SubscribeAction,
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
  getState: GetEditorState,
  dispatchAction: DispatchAction,
  subscribeAction: SubscribeAction
): ModelEditorTool {
  switch(toolType) {
    case ToolType.brush: {
      return new BrushTool({ canvas, getState, dispatchAction, subscribeAction });
    }
    case ToolType.colorize: {
      return new ColorizeTool({ canvas, getState, dispatchAction, subscribeAction });
    }
    case ToolType.erase: {
      return new EraseTool({ canvas, getState, dispatchAction, subscribeAction });
    }
  }

  throw new Error(`Invalid tool type: ${ToolType[toolType]}`);
}
