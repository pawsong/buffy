import * as THREE from 'three';
import StateLayer from '@pasta/core/lib/StateLayer';
import { Position } from '@pasta/core/lib/types';

import {
  PlayToolType,
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

import PlayModeTool, { InitParams } from './PlayModeTool';

const yUnit = new THREE.Vector3(0, 1, 0);

interface WaitStateProps {
  playerId: string,
}

class WaitState extends WorldEditorCanvsToolState<WaitStateProps> {
  cursorGeometry: THREE.Geometry;
  cursorOffset: Position;

  constructor(
    private view: WorldEditorCanvas,
    private stateLayer: StateLayer
  ) {
    super();

    this.cursorGeometry = new THREE.PlaneGeometry(1, 1);
    this.cursorGeometry.scale(PIXEL_SCALE, PIXEL_SCALE, PIXEL_SCALE);
    this.cursorGeometry.rotateX(- Math.PI / 2);

    this.cursorOffset = [PIXEL_SCALE_HALF, 0, PIXEL_SCALE_HALF];
  }

  mapStateToProps(gameState: WorldEditorState): WaitStateProps {
    return {
      playerId: gameState.playerId,
    };
  }

  onEnter() {
    this.view.cursorManager.start({
      cursorGeometry: this.cursorGeometry,
      cursorOffset: this.cursorOffset,
      hitTest: intersect => yUnit.dot(intersect.face.normal) !== 0,
    });
  }

  onLeave() {
    this.view.cursorManager.stop();
  }

  onMouseDown() {
    const { hit, position } = this.view.cursorManager.getPosition();
    if (!hit) { return; }

    this.stateLayer.rpc.move({
      id: this.props.playerId,
      x: position.x,
      z: position.z,
    });
  }

  render() {}
}

class MoveTool extends PlayModeTool {
  getToolType() { return PlayToolType.move; }

  init({ view, stateLayer }: InitParams) {
    const wait = new WaitState(view, stateLayer);

    return <WorldEditorCanvsToolStates>{
      wait,
    };
  }

  destroy() {}
}

export default MoveTool;
