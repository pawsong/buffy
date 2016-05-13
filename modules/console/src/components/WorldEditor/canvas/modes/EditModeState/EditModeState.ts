import {
  WorldEditorState,
  EditToolType,
  GetState,
} from '../../../types';
import WorldEditorCanvas from '../../WorldEditorCanvas';
import createTool, { EditModeTool, InitParams } from './tools';

import ModeState from '../ModeState';

class EditModeState extends ModeState<EditToolType, InitParams> {
  canvas: WorldEditorCanvas;

  constructor(getState: GetState, initParams: InitParams) {
    super(getState, initParams);
    this.canvas = initParams.view;
  }

  getToolType(editorState: WorldEditorState): EditToolType {
    return editorState.editTool;
  }

  // Lazy getter
  createTool(toolType: EditToolType): EditModeTool {
    return createTool(toolType, this.getState, {
      view: this.canvas,
    });
  }
}

export default EditModeState;
