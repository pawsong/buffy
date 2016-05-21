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

import Tool, { ToolState } from '../../../../../../libs/Tool';
export { ToolState }

export interface InitParams {
  view: WorldEditorCanvas;
  getState: GetState;
  getFiles: () => SourceFileDB;
  dispatchAction: DispatchAction;
  modelManager: ModelManager;
}

abstract class EditModeTool<T> extends Tool<EditToolType, InitParams, WorldEditorState, T> {}

export default EditModeTool;
