import THREE from 'three';
import * as shortid from 'shortid';
import StateLayer from '@pasta/core/lib/StateLayer';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';
import { Position } from '@pasta/core/lib/types';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
  DESIGN_SCALE,
} from '../../../../../../canvas/Constants';
import ModelManager from '../../../../../../canvas/ModelManager';
import Cursor from '../../../../../../canvas/Cursor';

import {
  SourceFile,
  SourceFileDB,
} from '../../../../../Studio/types';
import { RecipeEditorState } from '../../../../../RecipeEditor';

import {
  Color,
  WorldEditorState,
  EditToolType,
  DispatchAction,
} from '../../../../types';

import {
  addRobot,
} from '../../../../actions';

import EditModeTool, {
  InitParams,
  ToolState, ToolStates,
  ModeToolUpdateParams,
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

  cursor: Cursor;

  recipeFile: SourceFile;
  designWatcher: (geometry: THREE.Geometry) => any;

  constructor(private tool: AddRobotTool) {
    super();

    const geometry = new THREE.Geometry();

    this.cursor = new Cursor(tool.canvas, {
      getInteractables: () => [tool.canvas.chunk.mesh],
      geometry: new THREE.Geometry(), // Dummy
      material: tool.cursorMaterial,
      hitTest: intersect => yUnit.dot(intersect.face.normal) !== 0,
      onTouchTap: () => this.handleTouchTap(),
    });

    this.cursorOffset = [PIXEL_SCALE_HALF, PIXEL_SCALE_HALF, PIXEL_SCALE_HALF];
    this.designWatcher = geometry => {
      console.log(geometry);
      this.cursor.changeGeometry(geometry);
    }
  }

  // mapStateToProps(gameState: WorldEditorState): WaitStateProps {
  //   return {
  //     recipeId: gameState.editMode.addRobotRecipeId,
  //   };
  // }

  onEnter() {
    const files = this.tool.getFiles();
    this.recipeFile = files[this.tool.props.addRobotRecipeId];

    this.tool.modelManager.watch(this.recipeFile.state.design, this.designWatcher);
    this.cursor.start();
  }

  onLeave() {
    this.tool.modelManager.unwatch(this.recipeFile.state.design, this.designWatcher);
    this.cursor.stop();
    this.recipeFile = null;
  }

  handleTouchTap() {
    const position = this.cursor.getPosition();
    if (!position) return;

    this.tool.dispatchAction(addRobot({
      id: shortid.generate(),
      name: this.recipeFile.name,
      recipe: this.recipeFile.id,
      zone: this.tool.props.activeZoneId,
      position: [position.x, position.y, position.z],
      direction: [0, 0, 1],
    }));
  }
}

interface AddRobotToolProps {
  activeZoneId: string;
  addRobotRecipeId: string;
}

class AddRobotTool extends EditModeTool<AddRobotToolProps, void, void> {
  getFiles: () => SourceFileDB;
  modelManager: ModelManager;

  getToolType() { return EditToolType.ADD_ROBOT; }

  cursorMaterial: THREE.Material;

  mapParamsToProps({ editor }: ModeToolUpdateParams) {
    return {
      activeZoneId: editor.editMode.activeZoneId,
      addRobotRecipeId: editor.editMode.addRobotRecipeId,
    };
  }

  onInit(params: InitParams) {
    super.onInit(params);

    this.getFiles = params.getFiles;
    this.modelManager = params.modelManager;

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
      wait: new WaitState(this),
    };
  }

  onDestroy() {}
}

export default AddRobotTool;
