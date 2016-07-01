import THREE from 'three';

import CursorState from './states/CursorState';
import SelectTraceState, { StateEnterParams } from './states/SelectTraceState';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState, ToolStates,
} from './ModelEditorTool';

import {
  Position,
  ToolType,
  ModelEditorState,
  Axis,
} from '../../types';

import {
  voxelRemoveBatch,
  voxelMergeFragment,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';

interface EraseToolProps {
  size: Position;
  fragment: any;
  mode2D: {
    enabled: boolean;
    axis: Axis;
    position: number;
  };
}

class EraseTool extends ModelEditorTool<EraseToolProps, void, void> {
  cursorGeometry: THREE.Geometry;
  translucentMaterial: THREE.Material;

  getToolType(): ToolType { return ToolType.ERASE; }

  mapParamsToProps(params: ModelEditorState) {
    return {
      size: params.file.present.data.size,
      fragment: params.file.present.data.fragment,
      mode2D: params.file.present.data.mode2D,
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
    return {
      [STATE_WAIT]: new WaitState(this),
      [STATE_DRAG]: new DragState(this),
    };
  }

  hitTest(position: THREE.Vector3) {
    if (!this.props.mode2D.enabled) return true;

    switch(this.props.mode2D.axis) {
      case Axis.X: {
        return this.props.mode2D.position === position.x;
      }
      case Axis.Y: {
        return this.props.mode2D.position === position.y;
      }
      case Axis.Z: {
        return this.props.mode2D.position === position.z;
      }
    }

    return false;
  }

  onDestroy() {

  }
}

class WaitState extends CursorState<StateEnterParams> {
  constructor(private tool: EraseTool) {
    super(tool.canvas, {
      cursorOnFace: false,
      cursorGeometry: tool.cursorGeometry,
      cursorMaterial: tool.translucentMaterial,
      getSize: () => tool.props.size,
      getInteractables: () => [
        tool.canvas.component.modelMesh,
        tool.canvas.component.fragmentMesh,
      ],
      transitionRequiresHit: false,
      hitTest: position => tool.hitTest(position),
    });
  }

  getNextStateName() { return STATE_DRAG; }
  getNextStateParams(event: MouseEvent) { return event; }

  onMouseDown() {
    if (this.tool.props.fragment) this.tool.dispatchAction(voxelMergeFragment());
  }
}

class DragState extends SelectTraceState {
  constructor(private tool: EraseTool) {
    super(tool.canvas, {
      cursorOnFace: false,
      interactablesAreRotated: true,
      getSize: () => tool.props.size,
      traceMaterial: tool.translucentMaterial,
      getInteractables: () => [tool.canvas.component.modelMesh],
      hitTest: position => tool.hitTest(position),
    });
  }

  onTraceSelect(trace: Position[]) {
    this.tool.dispatchAction(voxelRemoveBatch(trace));
  }
}

export default EraseTool;
