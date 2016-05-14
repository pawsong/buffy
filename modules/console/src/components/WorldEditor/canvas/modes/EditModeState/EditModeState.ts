import {
  SourceFileDB,
} from '../../../../Studio/types';
import { RecipeEditorState } from '../../../../RecipeEditor';

import {
  WorldEditorState,
  EditToolType,
  GetState,
} from '../../../types';
import WorldEditorCanvas from '../../WorldEditorCanvas';
import createTool, { EditModeTool, InitParams } from './tools';

import ModeState from '../ModeState';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
} from '../../../../../canvas/Constants';

class EditModeState extends ModeState<EditToolType, InitParams> {
  getFiles: () => SourceFileDB;
  initParams: InitParams;

  constructor(getState: GetState, initParams: InitParams, getFiles: () => SourceFileDB) {
    super(getState, initParams);
    this.getFiles = getFiles;
    this.initParams = initParams;
  }

  getToolType(editorState: WorldEditorState): EditToolType {
    return editorState.editTool;
  }

  // Lazy getter
  createTool(toolType: EditToolType): EditModeTool {
    return createTool(toolType, this.getState, this.initParams);
  }

  handleEnter() {
    const canvas = this.initParams.view;

    canvas.objectManager.removeAll();

    // Connect to file store
    const state = this.getState();
    const zone = state.zones[state.activeZoneId];

    canvas.chunk.setData(zone.blocks);
    canvas.chunk.update();

    const files = this.getFiles();

    Object.keys(state.robots).forEach(id => {
      const robot = state.robots[id];
      const recipeFile =  files[robot.recipe];
      const recipe: RecipeEditorState = recipeFile.state;

      const object = canvas.objectManager.create(robot.id, recipe.design);
      // const mesh = new THREE.Mesh(this.canvas.cubeGeometry , this.canvas.cubeMaterial);
      // mesh.castShadow = true;

      // object.add(mesh);

      const { group } = object;

      group.position.x = robot.position[0] * PIXEL_SCALE - PIXEL_SCALE_HALF;
      group.position.y = robot.position[1] * PIXEL_SCALE - PIXEL_SCALE_HALF;
      group.position.z = robot.position[2] * PIXEL_SCALE - PIXEL_SCALE_HALF;

      group.lookAt(new THREE.Vector3(
        group.position.x + robot.direction[0],
        group.position.y + robot.direction[1],
        group.position.z + robot.direction[2]
      ));
    });

    super.handleEnter();
  }
}

export default EditModeState;
