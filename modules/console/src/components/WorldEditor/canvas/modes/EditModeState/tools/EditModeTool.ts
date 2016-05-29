import ModelManager from '../../../../../../canvas/ModelManager';
import {
  SourceFileDB,
} from '../../../../../Studio/types';
import {
  WorldEditorState,
  EditToolType,
  DispatchAction,
} from '../../../../types';

import ModeTool, { ToolState, ToolStates, ModeToolUpdateParams } from '../../ModeTool';
export { ToolState, ToolStates, ModeToolUpdateParams }

import WorldEditorCanvas from '../../../WorldEditorCanvas';

export interface InitParams {
  view: WorldEditorCanvas;
  getFiles: () => SourceFileDB;
  dispatchAction: DispatchAction;
  modelManager: ModelManager;
}

abstract class EditModeTool<P, S, T> extends ModeTool<EditToolType, InitParams, P, S, T> {
  canvas: WorldEditorCanvas;
  dispatchAction: DispatchAction;

  onInit({ view, dispatchAction }: InitParams) {
    this.canvas = view;
    this.dispatchAction = dispatchAction;
  }
}

export default EditModeTool;
