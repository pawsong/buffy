import StateLayer from '@pasta/core/lib/StateLayer';
import { SchemaType, Schema } from '@pasta/helper/lib/diff';
import LocalServer from '../../../../../LocalServer';
import {
  SourceFileDB,
} from '../../../../Studio/types';
import { RecipeEditorState } from '../../../../RecipeEditor';
import SimpleComponent from '../../../../../libs/SimpleComponent';

import {
  Robot,
  Action,
  ViewMode,
  WorldEditorState,
  EditToolType,
  GetState,
  DispatchAction,
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

interface UpdateParams {
  state: WorldEditorState;
  recipeFiles: SourceFileDB;
}

interface Props {
  scriptIsRunning: boolean;
  robots: { [index: string]: Robot };
  recipeFiles: SourceFileDB;
}

class EditModeComponent extends SimpleComponent<UpdateParams, Props> {
  constructor(private editModeState: EditModeState) {
    super();
  }

  getPropsSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        scriptIsRunning: {
          type: SchemaType.BOOLEAN,
        },
        robots: {
          type: SchemaType.MAP,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              recipe: { type: SchemaType.STRING },
              position: { type: SchemaType.ANY },
              direction: { type: SchemaType.ANY },
            },
          }
        },
        recipeFiles: {
          type: SchemaType.MAP,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              state: {
                type: SchemaType.OBJECT,
                properties: {
                  design: { type: SchemaType.STRING },
                }
              },
            },
          },
        },
      },
    };
  }

  mapProps({ state, recipeFiles }: UpdateParams) {
    return {
      scriptIsRunning: state.editMode.scriptIsRunning,
      robots: state.editMode.robots,
      recipeFiles,
    };
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.scriptIsRunning !== this.props.scriptIsRunning) {
      if (this.props.scriptIsRunning) {
        this.editModeState.startScript();
      } else {
        this.editModeState.stopScript();
      }
    }
  }

  render(diff: Props) {
    if (this.props.scriptIsRunning) return;
    if (!diff.robots) return;

    Object.keys(diff.robots).forEach(robotId => {
      const robot = diff.robots[robotId];
      if (robot) {
        this.editModeState.createOrUpdateRobot(robot, this.props.recipeFiles);
      } else {
        this.editModeState.canvas.objectManager.remove(robotId);
      }
    });
  }
}

class EditModeState extends ModeState<EditToolType, InitParams> {
  getFiles: () => SourceFileDB;
  initParams: InitParams;
  canvas: WorldEditorCanvas;
  component: EditModeComponent;

  private stateLayer: StateLayer;

  constructor(getState: GetState, initParams: InitParams, getFiles: () => SourceFileDB, stateLayer: StateLayer) {
    super(getState);
    this.getFiles = getFiles;
    this.initParams = initParams;
    this.canvas = initParams.view;
    this.stateLayer = stateLayer;
    this.component = new EditModeComponent(this);
  }

  handleStateChange(state: WorldEditorState) {
    super.handleStateChange(state);
    this.component.updateProps({
      state,
      recipeFiles: this.getFiles(),
    });
  }

  getToolType(editorState: WorldEditorState): EditToolType {
    return editorState.editMode.tool;
  }

  // Lazy getter
  createTool(toolType: EditToolType): EditModeTool<any> {
    return createTool(toolType, this.getState, this.initParams);
  }

  createOrUpdateRobot(robot: Robot, files: SourceFileDB) {
    const recipeFile = files[robot.recipe];
    const recipe: RecipeEditorState = recipeFile.state;

    const object = this.canvas.objectManager.create(robot.id, recipe.design);
    // const mesh = new THREE.Mesh(this.canvas.cubeGeometry , this.canvas.cubeMaterial);
    // mesh.castShadow = true;

    // object.add(mesh);

    const { group } = object;

    group.position.x = robot.position[0] * PIXEL_SCALE + PIXEL_SCALE_HALF;
    group.position.y = robot.position[1] * PIXEL_SCALE + PIXEL_SCALE_HALF;
    group.position.z = robot.position[2] * PIXEL_SCALE + PIXEL_SCALE_HALF;

    group.lookAt(new THREE.Vector3(
      group.position.x + robot.direction[0],
      group.position.y + robot.direction[1],
      group.position.z + robot.direction[2]
    ));
  }

  handleEnter() {
    this.syncCanvasToFileState();

    this.initParams.view.applyCameraMode(ViewMode.BIRDS_EYE);

    this.canvas.objectManager.removeAll();

    this.component.start({
      state: this.getState(),
      recipeFiles: this.getFiles(),
    });

    super.handleEnter();
  }

  handleLeave() {
    this.stopScript();

    super.handleLeave();
    this.component.stop();
  }

  syncCanvasToFileState() {
    const canvas = this.initParams.view;

    // Connect to file store
    const state = this.getState();
    const zone = state.editMode.zones[state.editMode.activeZoneId];

    canvas.chunk.setData(zone.blocks);
    canvas.chunk.update();
  }

  startScript() {
    this.component.stop();

    // Init data
    const files = this.getFiles();
    const { zones, robots, playerId } = this.getState().editMode;

    const server = <LocalServer>this.stateLayer.store;
    server.initialize(files, zones, robots);
    server.start();

    // Init view
    this.canvas.connectToStateStore(this.stateLayer.store);
  }

  stopScript() {
    // Clean up view
    this.canvas.disconnectFromStateStore();
    this.canvas.objectManager.removeAll();

    // Clean up data
    const server = <LocalServer>this.stateLayer.store;
    server.stop();

    // Restore canvas state from files
    this.component.start({
      state: this.getState(),
      recipeFiles: this.getFiles(),
    });
  }
}

export default EditModeState;
