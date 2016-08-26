import * as THREE from 'three';

import CursorState from '../states/CursorState';
import SelectTraceState, { StateEnterParams } from '../states/SelectTraceState';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from '../ModelEditorTool';

import {
  Position,
  ToolType,
  ModelEditorState,
} from '../../../types';

import {
  voxelMergeFragment,
} from '../../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';

interface EraseToolProps {
  size: Position;
  fragment: any;
}

interface EraseToolParams {
  getInteractables: () => THREE.Mesh[];
}

abstract class EraseTool extends ModelEditorTool<EraseToolProps, void, void> {
  cursorGeometry: THREE.Geometry;
  translucentMaterial: THREE.Material;

  getToolType(): ToolType { return ToolType.ERASE; }

  abstract getParams(): EraseToolParams;

  mapParamsToProps(params: ModelEditorState) {
    return {
      size: params.file.present.data.size,
      fragment: params.file.present.data.fragment,
    };
  }

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
    const params = this.getParams();

    return {
      [STATE_WAIT]: new WaitState(this, params),
      [STATE_DRAG]: new DragState(this, params),
    };
  }

  abstract getAction(trace: Position[]);

  onDestroy() {

  }
}

class WaitState extends CursorState<StateEnterParams> {
  constructor(private tool: EraseTool, params: EraseToolParams) {
    super(tool.canvas, {
      cursorOnFace: false,
      cursorGeometry: tool.cursorGeometry,
      cursorMaterial: tool.translucentMaterial,
      getSize: () => tool.props.size,
      getInteractables: params.getInteractables,
      transitionRequiresHit: false,
    });
  }

  getNextStateName() { return STATE_DRAG; }
  getNextStateParams(event: MouseEvent) { return event; }

  onMouseDown() {
    if (this.tool.props.fragment) this.tool.dispatchAction(voxelMergeFragment());
  }
}

class DragState extends SelectTraceState {
  constructor(private tool: EraseTool, params: EraseToolParams) {
    super(tool.canvas, {
      cursorOnFace: false,
      interactablesAreRotated: false,
      getSize: () => tool.props.size,
      traceMaterial: tool.translucentMaterial,
      getInteractables: params.getInteractables,
    });
  }

  onTraceSelect(trace: Position[]) {
    this.tool.dispatchAction(this.tool.getAction(trace));
  }
}

export default EraseTool;
