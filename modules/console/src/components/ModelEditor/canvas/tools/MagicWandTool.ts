import * as THREE from 'three';
import * as Immutable from 'immutable';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';
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
} from '../../types';

import {
  voxelMaginWand,
  voxelClearSelection,
} from '../../actions';

const STATE_WAIT = ToolState.STATE_WAIT;

interface MagicWandToolProps {
  selection: any;
}

class MagicWandTool extends ModelEditorTool<MagicWandToolProps, void, void> {
  translucentMaterial: THREE.Material;

  getToolType(): ToolType { return ToolType.MAGIC_WAND; }

  mapParamsToProps(params: ModelEditorState) {
    return {
      selection: params.file.present.data.selection,
    };
  }

  onInit(params: InitParams) {
    super.onInit(params);

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
    };
  }

  onDestroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: MagicWandTool) {
    super();
    const offset = new THREE.Vector3();

    this.cursor = new Cursor(tool.canvas, {
      getInteractables: () => [tool.canvas.component.modelMesh],
      geometry: tool.canvas.cubeGeometry,
      material: tool.translucentMaterial,
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
