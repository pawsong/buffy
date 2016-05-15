import {
  SourceFileDB,
} from '../../../../Studio/types';
import { RecipeEditorState } from '../../../../RecipeEditor';

import {
  Robot,
  Action,
  ViewMode,
  WorldEditorState,
  EditToolType,
  GetState,
  DispatchAction,
  SubscribeAction,
  UnsubscribeAction,
} from '../../../types';

import {
  ADD_ROBOT, AddRobotAction,
  REMOVE_ROBOT, RemoveRobotAction,
} from '../../../actions';

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
  subscribeAction: SubscribeAction;
  unsubscribeAction: UnsubscribeAction;

  constructor(getState: GetState, initParams: InitParams, getFiles: () => SourceFileDB, subscribeAction: SubscribeAction) {
    super(getState, initParams);
    this.getFiles = getFiles;
    this.initParams = initParams;
    this.subscribeAction = subscribeAction;
  }

  getToolType(editorState: WorldEditorState): EditToolType {
    return editorState.editMode.tool;
  }

  // Lazy getter
  createTool(toolType: EditToolType): EditModeTool {
    return createTool(toolType, this.getState, this.initParams);
  }

  addRobot(robot: Robot, files: SourceFileDB) {
    const canvas = this.initParams.view;

    const recipeFile = files[robot.recipe];
    const recipe: RecipeEditorState = recipeFile.state;

    const object = this.initParams.view.objectManager.create(robot.id, recipe.design);
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
  }

  handleEnter() {
    const canvas = this.initParams.view;

    canvas.objectManager.removeAll();

    // Connect to file store
    const state = this.getState();
    const zone = state.editMode.zones[state.editMode.activeZoneId];

    canvas.chunk.setData(zone.blocks);
    canvas.chunk.update();

    const files = this.getFiles();

    Object.keys(state.editMode.robots).forEach(id => {
      const robot = state.editMode.robots[id];
      this.addRobot(robot, files);
    });

    canvas.applyCameraMode(ViewMode.BIRDS_EYE);

    this.unsubscribeAction = this.subscribeAction(action => this.handleActionDispatch(action));

    super.handleEnter();
  }

  handleLeave() {
    super.handleLeave();
    this.unsubscribeAction();
  }

  handleActionDispatch(action: Action<any>) {
    switch(action.type) {
      case ADD_ROBOT: {
        const { robot } = <AddRobotAction>action;
        const files = this.getFiles();
        this.addRobot(robot, files);
        return;
      }
      case REMOVE_ROBOT: {
        const { robotId } = <RemoveRobotAction>action;
        this.initParams.view.objectManager.remove(robotId);
        return;
      }
    }
  }
}

export default EditModeState;
