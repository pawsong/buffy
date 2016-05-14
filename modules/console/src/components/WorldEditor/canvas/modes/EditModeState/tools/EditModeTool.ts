import {
  SourceFileDB,
} from '../../../../../Studio/types';
import {
  WorldEditorState,
  EditToolType,
  GetState,
} from '../../../../types';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

import WorldEditorCanvasTool from '../../WorldEditorCanvasTool';

export interface InitParams {
  view: WorldEditorCanvas;
  setEditorState: (editorState: WorldEditorState) => any;
}

abstract class EditModeTool extends WorldEditorCanvasTool<EditToolType, InitParams> {}

export default EditModeTool;
