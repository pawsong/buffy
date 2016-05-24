import {
  WorldEditorState,
  WorldData,
} from '../../types';

import Tool, { ToolState } from '../../../../libs/Tool';
export { ToolState }

export interface ModeToolUpdateParams {
  editor: WorldEditorState;
  file: WorldData;
}

abstract class ModeTool<T, U, V> extends Tool<T, U, ModeToolUpdateParams, V> {}

export default ModeTool;
