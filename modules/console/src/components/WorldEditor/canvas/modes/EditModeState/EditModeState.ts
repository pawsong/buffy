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
  WorldState,
  Zone,
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

interface EditModeComponentProps {
  state: WorldState;
  recipeFiles: SourceFileDB;
}

interface EditModeComponentTree {
  scriptIsRunning: boolean;
  robots: { [index: string]: Robot };
  zone: Zone;
  recipeFiles: SourceFileDB;
}

class EditModeComponent extends SimpleComponent<EditModeComponentProps, void, EditModeComponentTree> {
  constructor(private editModeState: EditModeState) {
    super();
  }

  getTreeSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        scriptIsRunning: {
          type: SchemaType.BOOLEAN,
        },
        zone: { type: SchemaType.ANY },
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

  render() {
    return {
      scriptIsRunning: this.props.state.editor.editMode.scriptIsRunning,
      zone: this.props.state.file.zones[this.props.state.editor.editMode.activeZoneId],
      robots: this.props.state.file.robots,
      recipeFiles: this.props.recipeFiles,
    };
  }

  componentDidUpdate(prevProps: EditModeComponentProps) {
    if (prevProps.state.editor.editMode.scriptIsRunning !==
        this.props.state.editor.editMode.scriptIsRunning) {
      if (this.props.state.editor.editMode.scriptIsRunning) {
        this.editModeState.startScript();
      } else {
        this.editModeState.stopScript();
      }
    }
  }

  patch(diff: EditModeComponentTree) {
    if (this.tree.scriptIsRunning) return;

    if (diff.robots) {
      Object.keys(diff.robots).forEach(robotId => {
        const robot = diff.robots[robotId];
        if (robot) {
          this.editModeState.createOrUpdateRobot(robot, this.tree.recipeFiles);
        } else {
          this.editModeState.canvas.objectManager.remove(robotId);
        }
      });
    }

    if (diff.zone) {
      this.editModeState.canvas.chunk.setData(diff.zone.blocks);
      this.editModeState.canvas.chunk.update();
    }
  }
}

class EditModeState extends ModeState<EditToolType, InitParams> {
  initParams: InitParams;
  component: EditModeComponent;

  constructor(initParams: InitParams, getFiles: () => SourceFileDB, stateLayer: StateLayer, state: WorldState) {
    super(initParams.view, stateLayer, getFiles, state);
    this.getFiles = getFiles;
    this.initParams = initParams;
    this.canvas = initParams.view;
    this.component = new EditModeComponent(this);
  }

  onStateChange(state: WorldState) {
    super.onStateChange(state);
    this.component.updateProps({
      state,
      recipeFiles: this.getFiles(),
    });
  }

  getToolType(editorState: WorldEditorState): EditToolType {
    return editorState.editMode.tool;
  }

  // Lazy getter
  createTool(toolType: EditToolType): EditModeTool<any, any, any> {
    return createTool(toolType, this.initParams);
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

  onEnter(state: WorldState) {
    super.onEnter(state);

    this.initParams.view.applyCameraMode(ViewMode.BIRDS_EYE);

    this.canvas.objectManager.removeAll();

    this.component.start({
      state: this.state,
      recipeFiles: this.getFiles(),
    });
  }

  startScript() {
    this.component.stop();
    this.startLocalServerMode();
  }

  stopScript() {
    this.stopLocalServerMode();
    this.canvas.objectManager.removeAll();

    // Restore canvas state from files
    this.component.start({
      state: this.state,
      recipeFiles: this.getFiles(),
    });
  }

  onLeave() {
    this.stopLocalServerMode();
    this.component.stop();
    super.onLeave();
  }
}

export default EditModeState;
