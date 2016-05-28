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

abstract class ModeTool<U, V, P, S, T> extends Tool<U, V, P, S, T> {
  mapParamsToProps(params: ModeToolUpdateParams): P {
    return null;
  };
}

export default ModeTool;
