import * as THREE from 'three';

import CursorState from './states/CursorState';
import SelectTraceState, { StateEnterParams } from './states/SelectTraceState';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
  DESIGN_IMG_SIZE,
} from '../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  Position,
  ToolType,
} from '../../types';

import {
  voxelRemoveBatch,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';

class EraseTool extends ModelEditorTool<void, void, void> {
  cursorGeometry: THREE.Geometry;
  translucentMaterial: THREE.Material;

  getToolType(): ToolType { return ToolType.ERASE; }

  onInit(params: InitParams) {
    super.onInit(params);

    this.cursorGeometry = new THREE.BoxGeometry(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.cursorGeometry.translate(PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF);

    this.translucentMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });
  }

  createStates(): ToolStates {
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAG]: new DragState(this),
    };
  }

  onDestroy() {

  }
}

class WaitState extends CursorState<StateEnterParams> {
  constructor(tool: EraseTool) {
    super(tool.canvas, {
      cursorOnFace: false,
      cursorGeometry: tool.cursorGeometry,
      cursorMaterial: tool.translucentMaterial,
      getInteractables: () => [
        tool.canvas.component.modelMesh,
        tool.canvas.component.fragmentMesh,
      ],
      transitionRequiresHit: false,
    });
  }

  getNextStateName() { return STATE_DRAG; }
  getNextStateParams(event: MouseEvent) { return event; }

  onMouseDown() {

  }
}

class DragState extends SelectTraceState {
  constructor(private tool: EraseTool) {
    super(tool.canvas, tool.translucentMaterial, () => [tool.canvas.component.modelMesh]);
  }

  onTraceSelect(trace: Position[]) {
    this.tool.dispatchAction(voxelRemoveBatch(trace));
  }
}

export default EraseTool;
