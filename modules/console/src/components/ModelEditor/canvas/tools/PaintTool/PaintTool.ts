import * as THREE from 'three';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';

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
  Color,
} from '../../../types';

import {
  voxelMergeFragment,
} from '../../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';

interface PaintToolProps {
  size: Position;
  paletteColor: Color;
  fragment: any;
}

interface PaintToolTree {
  color: Color;
}

interface PaintToolParams {
  getInteractables: () => THREE.Mesh[];
}

abstract class PaintTool extends ModelEditorTool<PaintToolProps, void, PaintToolTree> {
  cursorGeometry: THREE.Geometry;
  cursorMaterial: THREE.MeshBasicMaterial;

  getToolType(): ToolType { return ToolType.PAINT; }

  abstract getParams(): PaintToolParams;

  mapParamsToProps(params: ModelEditorState) {
    return {
      paletteColor: params.common.paletteColors[params.file.present.data.activeMap],
      size: params.file.present.data.size,
      fragment: params.file.present.data.fragment,
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
    const params = this.getParams();

    return {
      [STATE_WAIT]: new WaitState(this, params),
      [STATE_DRAG]: new DragState(this, params),
    };
  }

  abstract getAction(trace: Position[], color: Color);

  onDestroy() {

  }
}

class WaitState extends CursorState<StateEnterParams> {
  constructor(private tool: PaintTool, params: PaintToolParams) {
    super(tool.canvas, {
      cursorOnFace: false,
      cursorGeometry: tool.cursorGeometry,
      cursorMaterial: tool.cursorMaterial,
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
  constructor(private tool: PaintTool, params: PaintToolParams) {
    super(tool.canvas, {
      cursorOnFace: false,
      interactablesAreRotated: false,
      traceMaterial: tool.cursorMaterial,
      getSize: () => tool.props.size,
      getInteractables: params.getInteractables,
    });
  }

  onTraceSelect(trace: Position[]) {
    this.tool.dispatchAction(this.tool.getAction(trace, this.tool.props.paletteColor));
  }
}

export default PaintTool;
