import StateLayer from '@pasta/core/lib/StateLayer';
import Fsm, { State } from '../../../../libs/Fsm';
import {
  WorldEditorState,
  EditorMode,
  GetState,
} from '../../types';
import Tool from '../../../../libs/Tool';
import {
  CHANGE_MODE,
  CHANGE_STATE,
  MOUSE_DOWN,
  MOUSE_UP,
} from './Events';
import WorldEditorCanvas from '../WorldEditorCanvas';

import LocalServer from '../../../../LocalServer';
import {
  SourceFileDB,
} from '../../../Studio/types';
import { Sandbox, Scripts } from '../../../../sandbox';
import { compileBlocklyXml } from '../../../../blockly/utils';

import {
  RecipeEditorState,
} from '../../../RecipeEditor';
import {
  CodeEditorState,
} from '../../../CodeEditor';

abstract class ModeState<T, U> extends State {
  canvas: WorldEditorCanvas;

  protected tool: Tool<T, U, any, any>;
  protected getState: GetState;
  protected getFiles: () => SourceFileDB;

  private sandbox: Sandbox;
  private stateLayer: StateLayer;
  private frameId: number;
  private cachedTools: { [index: string]: Tool<T, U, any, any> };

  constructor(canvas: WorldEditorCanvas, getState: GetState, stateLayer: StateLayer, getFiles: () => SourceFileDB) {
    super({
      [State.EVENT_ENTER]: () => this.handleEnter(),
      [State.EVENT_LEAVE]: () => this.handleLeave(),
      [CHANGE_MODE]: (mode: EditorMode) => ({ state: EditorMode[mode] }),
      [CHANGE_STATE]: (state: WorldEditorState) => this.handleStateChange(state),
    });

    this.canvas = canvas;
    this.stateLayer = stateLayer;
    this.getState = getState;
    this.getFiles = getFiles;
    this.cachedTools = {};

    this.sandbox = new Sandbox(stateLayer);
  }

  init() {
    const state = this.getState();
    this.tool = this.getOrCreateTool(this.getToolType(state));
  }

  handleEnter() {
    this.tool.start(this.getState());
  }

  handleStateChange(state: WorldEditorState) {
    const toolType = this.getToolType(state);

    if (this.tool.getToolType() !== toolType) {
      const nextTool = this.getOrCreateTool(toolType);
      this.tool.stop();
      this.tool = nextTool;
      this.tool.start(state);
    } else {
      this.tool.updateProps(state);
    }
  }

  animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    this.canvas.render();
  }

  startLocalServerMode() {
    // Init data
    const recipeFiles = this.getFiles();
    const { zones, robots, playerId } = this.getState().editMode;

    const server = <LocalServer>this.stateLayer.store;
    server.initialize(recipeFiles, zones, robots);
    server.start();

    // Init view
    this.canvas.connectToStateStore(this.stateLayer.store);
    this.animate();

    // Start user script
    const codeFiles = this.getFiles();
    const robotsList = Object.keys(robots).map(robotId => robots[robotId]);

    const recipes: { [index: string]: RecipeEditorState } = {};
    robotsList.forEach(robot => {
      recipes[robot.recipe] = recipeFiles[robot.recipe].state;
    });

    const codesSet = {};
    Object.keys(recipes).forEach(robotId => {
      const robotState = recipes[robotId];
      robotState.codes.forEach(code => codesSet[code] = true);
    });

    const codes: { [index: string]: Scripts } = {};
    Object.keys(codesSet).map(codeId => {
      const codeState = <CodeEditorState>codeFiles[codeId].state;
      codes[codeId] = compileBlocklyXml(codeState.workspace);
    });

    robotsList.forEach(robot => {
      const recipe = recipes[robot.recipe];
      recipe.codes.forEach(codeId => {
        this.sandbox.exec(robot.id, codes[codeId]);
      });
    });

    this.sandbox.emit('when_run');
  }

  stopLocalServerMode() {
    // Clean up Sandbox
    this.sandbox.reset();

    // Clean up view
    cancelAnimationFrame(this.frameId);
    this.canvas.disconnectFromStateStore();

    // Clean up data
    const server = <LocalServer>this.stateLayer.store;
    server.stop();
  }

  handleLeave() {
    this.tool.stop();
  }

  abstract getToolType(editorState: WorldEditorState): T;
  abstract createTool(toolType: T): Tool<T, U, any, any>;

  private getOrCreateTool(toolType: T): Tool<T, U, any, any> {
    const tool = this.cachedTools[toolType as any];
    if (tool) return tool;

    return this.cachedTools[toolType as any] = this.createTool(toolType);
  }

  destroy() {
    // Destroy tools
    Object.keys(this.cachedTools).forEach(key => this.cachedTools[key].destroy());
  }
}

export default ModeState;
