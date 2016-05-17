import ModelManager from '../../../../../../canvas/ModelManager';
import {
  SourceFileDB,
} from '../../../../../Studio/types';
import {
  WorldEditorState,
  EditToolType,
  GetState,
  DispatchAction,
  SubscribeAction,
} from '../../../../types';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import Tool, { ToolState } from '../../../../../../libs/Tool';
export { ToolState }

export interface InitParams {
  view: WorldEditorCanvas;
  getState: GetState;
  getFiles: () => SourceFileDB;
  dispatchAction: DispatchAction;
  subscribeAction: SubscribeAction;
  modelManager: ModelManager;
}

abstract class EditModeTool extends Tool<EditToolType, InitParams> {}

export default EditModeTool;
