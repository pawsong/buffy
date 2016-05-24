import ModelManager from '../../../../../../canvas/ModelManager';
import {
  SourceFileDB,
} from '../../../../../Studio/types';
import {
  WorldEditorState,
  EditToolType,
  DispatchAction,
} from '../../../../types';

import ModeTool, { ToolState, ModeToolUpdateParams } from '../../ModeTool';
export { ToolState, ModeToolUpdateParams }

import WorldEditorCanvas from '../../../WorldEditorCanvas';

export interface InitParams {
  view: WorldEditorCanvas;
  getFiles: () => SourceFileDB;
  dispatchAction: DispatchAction;
  modelManager: ModelManager;
}

abstract class EditModeTool<T> extends ModeTool<EditToolType, InitParams, T> {}

export default EditModeTool;
