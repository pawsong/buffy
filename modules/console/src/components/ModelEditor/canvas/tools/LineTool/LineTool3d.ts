import LineTool from './LineTool';
import { AddBlockToolProps } from '../AddBlockTool';

import {
  Volumn,
  Color,
  ToolType,
  ModelEditorState,
} from '../../../types';

import {
  voxelAddBatch3d,
} from '../../../actions';

interface LineTool3dProps extends AddBlockToolProps {

}

class LineTool3d extends LineTool<LineTool3dProps> {
  getToolType() { return ToolType.LINE_3D; }

  getParams() {
    return {
      getInteractables: () => [
        this.canvas.component.plane,
        this.canvas.component.modelMesh,
        this.canvas.component.fragmentMesh,
      ],
      interactablesAreRotated: false,
    };
  }

  mapParamsToProps(state: ModelEditorState) {
    return {
      size: state.file.present.data.size,
      color: state.common.paletteColor,
      fragment: state.file.present.data.fragment,
    };
  }

  onDragEnter() {}

  getAction(volumn: Volumn, color: Color) {
    return voxelAddBatch3d(volumn, color);
  }
}

export default LineTool3d;
