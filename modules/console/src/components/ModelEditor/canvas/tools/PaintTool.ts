import THREE from 'three';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';

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
  Color,
  Axis,
} from '../../types';

import {
  voxelRemoveBatch,
  voxelMergeFragment,
  voxelPaint,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';

interface PaintToolProps {
  size: Position;
  paletteColor: Color;
  fragment: any;
  mode2D: {
    enabled: boolean;
    axis: Axis;
    position: number;
  };
}

interface PaintToolTree {
  color: Color;
}

class PaintTool extends ModelEditorTool<PaintToolProps, void, PaintToolTree> {
  cursorGeometry: THREE.Geometry;
  cursorMaterial: THREE.MeshBasicMaterial;

  getToolType(): ToolType { return ToolType.PAINT; }

  mapParamsToProps(params: ModelEditorState) {
    return {
      paletteColor: params.common.paletteColor,
      size: params.file.present.data.size,
      fragment: params.file.present.data.fragment,
      mode2D: params.file.present.data.mode2D,
    };
  }

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        color: { type: SchemaType.ANY },
      },
    };
  }

  render() {
    return { color: this.props.paletteColor }
  }

  patch(diff: PaintToolTree) {
    if (diff.hasOwnProperty('color')) {
      this.cursorMaterial.color.setRGB(diff.color.r / 0xff, diff.color.g / 0xff, diff.color.b / 0xff);
    }
  }

  onInit(params: InitParams) {
    super.onInit(params);

    this.cursorGeometry = new THREE.BoxGeometry(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.cursorGeometry.translate(PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF);

    this.cursorMaterial = new THREE.MeshBasicMaterial({
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
}

class WaitState extends CursorState<StateEnterParams> {
  constructor(private tool: PaintTool) {
    super(tool.canvas, {
      cursorOnFace: false,
      cursorGeometry: tool.cursorGeometry,
      cursorMaterial: tool.cursorMaterial,
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
  constructor(private tool: PaintTool) {
    super(tool.canvas, {
      cursorOnFace: false,
      interactablesAreRotated: true,
      traceMaterial: tool.cursorMaterial,
      getSize: () => tool.props.size,
      getInteractables: () => [
        tool.canvas.component.modelMesh,
      ],
      hitTest: position => tool.hitTest(position),
    });
  }

  onTraceSelect(trace: Position[]) {
    this.tool.dispatchAction(voxelPaint(trace, this.tool.props.paletteColor));
  }
}

export default PaintTool;
