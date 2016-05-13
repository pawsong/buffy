import {
  SourceFileDB,
} from '../../../../../Studio/types';
import {
  EditToolType,
  GetState,
} from '../../../../types';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import WorldEditorCanvasTool from '../../WorldEditorCanvasTool';

export interface InitParams {
  view: WorldEditorCanvas;
}

abstract class EditModeTool extends WorldEditorCanvasTool<EditToolType, InitParams> {}

export default EditModeTool;
