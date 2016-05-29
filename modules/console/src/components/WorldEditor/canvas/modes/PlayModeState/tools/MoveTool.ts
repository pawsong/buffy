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
  ToolState, ToolStates,
  ModeToolUpdateParams,
} from './PlayModeTool';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

const yUnit = new THREE.Vector3(0, 1, 0);

class WaitState extends ToolState {
  cursorGeometry: THREE.Geometry;
  cursorMaterial: THREE.MeshBasicMaterial;

  cursorOffset: Position;
  cursor: Cursor;

  constructor(private tool: MoveTool) {
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

    this.cursor = new Cursor(tool.canvas, {
      geometry: this.cursorGeometry,
      material: this.cursorMaterial,
      offset: this.cursorOffset,
      getInteractables: () => [tool.canvas.chunk.mesh],
      hitTest: intersect => yUnit.dot(intersect.face.normal) !== 0,
      onTouchTap: () => this.handleMouseDown(),
      renderOnUpdate: false,
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

    this.tool.stateLayer.rpc.move({
      id: this.tool.props.playerId,
      x: position.x,
      z: position.z,
    });
  }
}

interface MoveToolProps {
  playerId: string;
}

class MoveTool extends PlayModeTool<MoveToolProps, void, void> {
  getToolType() { return PlayToolType.MOVE; }

  mapParamsToProps({ file }: ModeToolUpdateParams) {
    return {
      playerId: file.playerId,
    };
  }

  createStates(): ToolStates {
    return {
      wait: new WaitState(this),
    };
  }

  destroy() {}
}

export default MoveTool;
