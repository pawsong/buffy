import * as THREE from 'three';
import * as Immutable from 'immutable';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';
import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../canvas/Constants';

import ModelEditorTool, {
  InitParams,
  ToolState,
} from './ModelEditorTool';

import ModelEditorCanvas from '../ModelEditorCanvas';
import { SetState } from '../types';

import {
  Position,
  ToolType,
  DispatchAction,
  ModelEditorState,
} from '../../types';

import {
  voxelMaginWand,
  voxelClearSelection,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;
const STATE_DRAG = 'drag';

interface MagicWandToolProps {
  selection: any;
}

class MagicWandTool extends ModelEditorTool<MagicWandToolProps, void, void> {
  translucentMaterial: THREE.Material;

  getToolType(): ToolType { return ToolType.MAGIC_WAND; }

  dispatchAction: DispatchAction;

  mapParamsToProps(params: ModelEditorState) {
    return {
      selection: params.file.present.data.selection,
    };
  }

  init(params: InitParams) {
    this.dispatchAction = params.dispatchAction;

    this.translucentMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    const wait = new WaitState(this, params.canvas);

    return {
      [STATE_WAIT]: wait,
    };
  }

  destroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(
    private tool: MagicWandTool,
    private canvas: ModelEditorCanvas
  ) {
    super();
    const offset = new THREE.Vector3();

    this.cursor = new Cursor(canvas, {
      getInteractables: () => [this.canvas.component.modelMesh],
      geometry: this.canvas.cubeGeometry,
      material: this.tool.translucentMaterial,
      getOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      onMouseDown: params => this.handleMouseDown(params),
    });
  }

  onEnter(event?: MouseEvent) {
    this.cursor.start(event);
  }

  handleMouseDown({ event, intersect }: CursorEventParams) {
    const position = this.cursor.getPosition();
    if (position) {
      this.tool.dispatchAction(voxelMaginWand(position.x, position.y, position.z));
    } else {
      if (this.tool.props.selection) this.tool.dispatchAction(voxelClearSelection());
    }
  }

  onLeave() {
    this.cursor.stop();
  }
}

export default MagicWandTool;
