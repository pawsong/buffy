import {
  SourceFileDB,
} from '../../../../../Studio/types';
import {
  WorldEditorState,
  EditToolType,
  DispatchAction,
} from '../../../../types';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import WorldEditorCanvasTool from '../../WorldEditorCanvasTool';

export interface InitParams {
  view: WorldEditorCanvas;
  dispatchAction: DispatchAction;
}

abstract class EditModeTool extends WorldEditorCanvasTool<EditToolType, InitParams> {}

export default EditModeTool;
