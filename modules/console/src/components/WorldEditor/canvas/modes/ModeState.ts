import StateLayer from '@pasta/core/lib/StateLayer';
import Fsm, { State } from '../../../../libs/Fsm';
import {
  WorldEditorState,
  EditorMode,
  FileState,
  WorldState,
} from '../../types';
// import Tool from '../../../../libs/Tool';
import ModeTool from './ModeTool';
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
  CodeExtraData,
} from '../../../CodeEditor';

abstract class ModeState<T, U> extends State {
  canvas: WorldEditorCanvas;

  protected tool: ModeTool<T, U, any, any, any>;
  protected getFiles: () => SourceFileDB;

  private sandbox: Sandbox;
  private stateLayer: StateLayer;
  private frameId: number;
  private cachedTools: { [index: string]: ModeTool<T, U, any, any, any> };

  protected state: WorldState;

  constructor(canvas: WorldEditorCanvas, stateLayer: StateLayer, getFiles: () => SourceFileDB, state: WorldState) {
    super({
      [State.EVENT_ENTER]: (state: WorldState) => this.onEnter(state),
      [State.EVENT_LEAVE]: () => this.onLeave(),
      [CHANGE_MODE]: (state: WorldState) => ({
        state: EditorMode[state.editor.common.mode],
        params: state,
      }),
      [CHANGE_STATE]: (state: WorldState) => this.onStateChange(state),
    });

    this.canvas = canvas;
    this.stateLayer = stateLayer;
    this.getFiles = getFiles;
    this.cachedTools = {};

    this.sandbox = new Sandbox(stateLayer);
    this.state = state;
  }

  init() {
    this.tool = this.getOrCreateTool(this.getToolType(this.state.editor));
  }

  onEnter(state: WorldState) {
    this.state = state;
    const props = this.tool.mapParamsToProps(state);
    this.tool.start(props);
  }

  protected onStateChange(state: WorldState) {
    const toolType = this.getToolType(state.editor);

    if (this.tool.getToolType() !== toolType) {
      const nextTool = this.getOrCreateTool(toolType);
      this.tool.stop();
      this.tool = nextTool;
      const props = this.tool.mapParamsToProps(state);
      this.tool.start(props);
    } else {
      const props = this.tool.mapParamsToProps(state);
      if (props) this.tool.updateProps(props);
    }

    this.state = state;
  }

  animate = () => {
    this.frameId = requestAnimationFrame(this.animate);
    this.canvas.render();
  }

  startLocalServerMode() {
    // Init data
    const recipeFiles = this.getFiles();
    const { zones, robots, playerId } = this.state.file;

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
      const { workspace } = <CodeExtraData>codeFiles[codeId].extraData;
      codes[codeId] = compileBlocklyXml(workspace);
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

  onLeave() {
    this.tool.stop();
  }

  abstract getToolType(editorState: WorldEditorState): T;
  abstract createTool(toolType: T): ModeTool<T, U, any, any, any>;

  private getOrCreateTool(toolType: T): ModeTool<T, U, any, any, any> {
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
