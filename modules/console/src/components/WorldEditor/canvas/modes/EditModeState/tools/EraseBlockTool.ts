import * as THREE from 'three';
import { Position } from '@pasta/core/lib/types';

import {
  EditToolType,
  WorldEditorState,
} from '../../../../types';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../../canvas/Constants';

import WorldEditorCanvasTool, {
  WorldEditorCanvsToolState,
  WorldEditorCanvsToolStates,
} from '../../WorldEditorCanvasTool';
import WorldEditorCanvas from '../../../WorldEditorCanvas';

import EditModeTool, { InitParams } from './EditModeTool';

import { CursorEventParams } from '../../../CursorManager';

interface WaitStateProps {}

class WaitState extends WorldEditorCanvsToolState<WaitStateProps> {
  constructor(
    private tool: EraseBlockTool,
    private canvas: WorldEditorCanvas
  ) {
    super();
  }

  onEnter() {
    const offset = new THREE.Vector3();

    this.canvas.cursorManager.start({
      cursorGeometry: this.tool.cursorGeometry,
      cursorMaterial: this.tool.cursorMaterial,
      getCursorOffset: normal => offset.set(
        PIXEL_SCALE_HALF * (1 - 2 * normal.x),
        PIXEL_SCALE_HALF * (1 - 2 * normal.y),
        PIXEL_SCALE_HALF * (1 - 2 * normal.z)
      ),
      onTouchTap: (params) => this.handleTouchTap(params),
    });
  }

  onLeave() {
    this.canvas.cursorManager.stop();
  }

  handleTouchTap({ event, intersect }: CursorEventParams) {
    const { hit, position } = this.canvas.cursorManager.getPosition();
    if (!hit) return;

    // TODO: Refactoring
    // This is bad... this is possible because view directly accesses data memory space.
    // But we have to explicitly get memory address from data variable.
    this.canvas.chunk.remove([
      position.x,
      position.y,
      position.z,
    ]);
    this.canvas.chunk.update();
  }

  render() {}
}

class EraseBlockTool extends EditModeTool {
  cursorGeometry: THREE.Geometry;
  cursorMaterial: THREE.Material;

  getToolType() { return EditToolType.eraseBlock; }

  init({ view }: InitParams) {
    this.cursorGeometry = new THREE.CubeGeometry(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.cursorMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    const wait = new WaitState(this, view);

    return <WorldEditorCanvsToolStates>{
      wait,
    };
  }

  destroy() {
  }
}

export default EraseBlockTool;
