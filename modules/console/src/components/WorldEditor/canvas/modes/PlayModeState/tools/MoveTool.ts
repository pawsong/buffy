import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import { Position } from '@pasta/core/lib/types';

import {
  PlayToolType,
  WorldEditorState,
  GetState,
} from '../../../../types';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../../canvas/Constants';
import Cursor from '../../../../../../canvas/Cursor';

import PlayModeTool, {
  InitParams,
  ToolState,
} from './PlayModeTool';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

const yUnit = new THREE.Vector3(0, 1, 0);

class WaitState extends ToolState {
  cursorGeometry: THREE.Geometry;
  cursorMaterial: THREE.MeshBasicMaterial;

  cursorOffset: Position;
  cursor: Cursor;

  constructor(
    private canvas: WorldEditorCanvas,
    private stateLayer: StateLayer,
    private getState: GetState
  ) {
    super();

    this.cursorGeometry = new THREE.PlaneGeometry(1, 1);
    this.cursorGeometry.scale(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.cursorGeometry.rotateX(- Math.PI / 2);

    this.cursorOffset = [PIXEL_SCALE_HALF, 0, PIXEL_SCALE_HALF];

    this.cursorMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    this.cursor = new Cursor(canvas, {
      geometry: this.cursorGeometry,
      material: this.cursorMaterial,
      offset: this.cursorOffset,
      getInteractables: () => [this.canvas.chunk.mesh],
      hitTest: intersect => yUnit.dot(intersect.face.normal) !== 0,
      onTouchTap: () => this.handleMouseDown(),
    });
  }

  onEnter() {
    this.cursor.start();
  }

  onLeave() {
    this.cursor.stop();
  }

  handleMouseDown() {
    const position = this.cursor.getPosition();
    if (!position) return;

    const { editMode: { playerId } } = this.getState();

    this.stateLayer.rpc.move({
      id: playerId,
      x: position.x,
      z: position.z,
    });
  }
}

class MoveTool extends PlayModeTool<void> {
  getToolType() { return PlayToolType.MOVE; }

  init({ view, stateLayer, getState }: InitParams) {
    const wait = new WaitState(view, stateLayer, getState);

    return {
      wait,
    };
  }

  destroy() {}
}

export default MoveTool;
