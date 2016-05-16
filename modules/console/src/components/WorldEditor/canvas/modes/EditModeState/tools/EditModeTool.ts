import ModelManager from '../../../../../../canvas/ModelManager';
import {
  SourceFileDB,
} from '../../../../../Studio/types';
import {
  WorldEditorState,
  EditToolType,
  GetState,
  DispatchAction,
} from '../../../../types';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import WorldEditorCanvasTool from '../../WorldEditorCanvasTool';

export interface InitParams {
  view: WorldEditorCanvas;
  getState: GetState;
  getFiles: () => SourceFileDB;
  dispatchAction: DispatchAction;
  modelManager: ModelManager;
}

abstract class EditModeTool extends WorldEditorCanvasTool<EditToolType, InitParams> {}

export default EditModeTool;
