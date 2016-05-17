import * as THREE from 'three';
import * as shortid from 'shortid';
import StateLayer from '@pasta/core/lib/StateLayer';

import { Position } from '@pasta/core/lib/types';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
  DESIGN_SCALE,
} from '../../../../../../canvas/Constants';
import ModelManager from '../../../../../../canvas/ModelManager';

import {
  SourceFile,
  SourceFileDB,
} from '../../../../../Studio/types';
import { RecipeEditorState } from '../../../../../RecipeEditor';

import {
  Color,
  GetState,
  WorldEditorState,
  EditToolType,
  DispatchAction,
} from '../../../../types';

import {
  addRobot,
} from '../../../../actions';

import EditModeTool, {
  InitParams,
  ToolState,
} from './EditModeTool';

import WorldEditorCanvas from '../../../WorldEditorCanvas';

export function rgbToHex({ r, g, b }) {
  return (1 << 24) | (r << 16) | (g << 8) | b;
}

const yUnit = new THREE.Vector3(0, 1, 0);

interface WaitStateProps {
  recipeId: string;
}

class WaitState extends ToolState {
  cursorOffset: Position;

  recipeFile: SourceFile;
  designWatcher: (geometry: THREE.Geometry) => any;

  constructor(
    private cursorMaterial: THREE.Material,
    private canvas: WorldEditorCanvas,
    private getState: GetState,
    private getFiles: () => SourceFileDB,
    private dispatchAction: DispatchAction,
    private modelManager: ModelManager
  ) {
    super();

    this.cursorOffset = [PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF];
    this.designWatcher = geometry => {
      this.canvas.cursorManager.stop();
      this.canvas.cursorManager.start({
        getInteractables: () => [this.canvas.chunk.mesh],
        cursorGeometry: geometry,
        cursorMaterial: cursorMaterial,
        cursorScale: DESIGN_SCALE,
        hitTest: intersect => yUnit.dot(intersect.face.normal) !== 0,
        onTouchTap: () => this.handleTouchTap(),
      });
    };
  }

  // mapStateToProps(gameState: WorldEditorState): WaitStateProps {
  //   return {
  //     recipeId: gameState.editMode.addRobotRecipeId,
  //   };
  // }

  onEnter() {
    const { addRobotRecipeId } = this.getState().editMode;

    const files = this.getFiles();
    this.recipeFile = files[addRobotRecipeId];

    this.modelManager.watch(this.recipeFile.state.design, this.designWatcher);
  }

  onLeave() {
    this.modelManager.unwatch(this.recipeFile.state.design, this.designWatcher);
    this.canvas.cursorManager.stop();
    this.recipeFile = null;
  }

  handleTouchTap() {
    const { hit, position } = this.canvas.cursorManager.getPosition();
    if (!hit) { return; }

    const { activeZoneId } = this.getState().editMode;

    this.dispatchAction(addRobot({
      id: shortid.generate(),
      name: this.recipeFile.name,
      recipe: this.recipeFile.id,
      zone: activeZoneId,
      position: [position.x, position.y, position.z],
      direction: [0, 0, 1],
    }));
  }
}

class AddRobotTool extends EditModeTool{
  getToolType() { return EditToolType.ADD_ROBOT; }

  cursorMaterial: THREE.Material;

  init({ view, getState, getFiles, dispatchAction, modelManager }: InitParams) {
    this.cursorMaterial = new THREE.MeshBasicMaterial({
      vertexColors: THREE.VertexColors,
      opacity: 0.5,
      transparent: true,
      polygonOffset: true,
      polygonOffsetFactor: -0.1,
    });

    const wait = new WaitState(this.cursorMaterial, view, getState, getFiles, dispatchAction, modelManager);

    return {
      wait,
    };
  }

  destroy() {}
}

export default AddRobotTool;
