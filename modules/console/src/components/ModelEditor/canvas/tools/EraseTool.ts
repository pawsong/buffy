import * as THREE from 'three';

import Cursor, { CursorEventParams } from '../../../../canvas/Cursor';

import SelectTraceState from './states/SelectTraceState';

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
  translucentMaterial: THREE.Material;

  getToolType(): ToolType { return ToolType.ERASE; }

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
      [STATE_DRAG]: new DragState(this),
    };
  }

  onDestroy() {

  }
}

class WaitState extends ToolState {
  cursor: Cursor;

  constructor(private tool: EraseTool) {
    super();

    const offset = new THREE.Vector3();
    const position = new THREE.Vector3();

    this.cursor = new Cursor(tool.canvas, {
      geometry: this.tool.canvas.cubeGeometry,
      material: this.tool.translucentMaterial,
      getOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      getInteractables: () => [
        this.tool.canvas.component.modelMesh,
        this.tool.canvas.component.fragmentMesh,
      ],
      hitTest: (intersect, meshPosition) => {
        Cursor.getDataPosition(meshPosition, position);
        return (
             position.x >= 0 && position.x < DESIGN_IMG_SIZE
          && position.y >= 0 && position.y < DESIGN_IMG_SIZE
          && position.z >= 0 && position.z < DESIGN_IMG_SIZE
        );
      },
      onMouseDown: params => this.handleMouseDown(params),
    });
  }

  onEnter(event?: MouseEvent) {
    this.cursor.start(event);
  }

  handleMouseDown({ event, intersect }: CursorEventParams) {
    this.transitionTo(STATE_DRAG, event);
  }

  onLeave() {
    this.cursor.stop();
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
