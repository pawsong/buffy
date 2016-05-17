import StateLayer from '@pasta/core/lib/StateLayer';
import LocalServer from '../../../../../LocalServer';
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
  RUN_SCRIPT,
  STOP_SCRIPT,
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

  private stateLayer: StateLayer;

  constructor(getState: GetState, initParams: InitParams, getFiles: () => SourceFileDB, subscribeAction: SubscribeAction, stateLayer: StateLayer) {
    super(getState);
    this.getFiles = getFiles;
    this.initParams = initParams;
    this.subscribeAction = subscribeAction;
    this.stateLayer = stateLayer;
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
    this.syncCanvasToFileState();

    this.initParams.view.applyCameraMode(ViewMode.BIRDS_EYE);

    this.unsubscribeAction = this.subscribeAction(action => this.handleActionDispatch(action));

    super.handleEnter();
  }

  handleLeave() {
    this.stopScript();

    super.handleLeave();
    this.unsubscribeAction();
  }

  syncCanvasToFileState() {
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
  }

  startScript() {
    const canvas = this.initParams.view;

    const files = this.getFiles();
    const { zones, robots, playerId } = this.getState().editMode;

    const server = <LocalServer>this.stateLayer.store;
    server.initialize(files, zones, robots);
    server.start();

    // Init view

    // TODO: Filter objects on current active map.
    Object.keys(this.stateLayer.store.objects).forEach(key => {
      const object = this.stateLayer.store.objects[key];
      this.stateLayer.store.watchObject(object);
    })
    canvas.connectToStateStore(this.stateLayer.store);
  }

  stopScript() {
    const canvas = this.initParams.view;

    const server = <LocalServer>this.stateLayer.store;
    server.stop();

    // TODO: Think about nicer api for unwatching...
    Object.keys(this.stateLayer.store.objects).forEach(key => {
      const object = this.stateLayer.store.objects[key];
      this.stateLayer.store.unwatchObject(object);
    })
    canvas.disconnectFromStateStore();

    this.syncCanvasToFileState();
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
      case RUN_SCRIPT: {
        this.startScript();
        return;
      }
      case STOP_SCRIPT: {
        this.stopScript();
        return;
      }
    }
  }
}

export default EditModeState;
