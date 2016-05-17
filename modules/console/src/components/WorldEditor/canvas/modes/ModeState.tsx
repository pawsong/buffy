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

abstract class ModeState<T, U> extends State {
  tool: Tool<T, U>;
  getState: GetState;

  private cachedTools: { [index: string]: Tool<T, U> };

  constructor(getState: GetState) {
    super({
      [State.EVENT_ENTER]: () => this.handleEnter(),
      [State.EVENT_LEAVE]: () => this.handleLeave(),
      [CHANGE_MODE]: (mode: EditorMode) => ({ state: EditorMode[mode] }),
      [CHANGE_STATE]: (state: WorldEditorState) => this.handleStateChange(state),
    });

    this.getState = getState;
    this.cachedTools = {};
  }

  init() {
    const state = this.getState();
    this.tool = this.getOrCreateTool(this.getToolType(state));
  }

  handleEnter() {
    const state = this.getState();

    this.tool.start();
    this.handleStateChange(state);
  }

  handleLeave() {
    this.tool.stop();
  }

  handleStateChange(state: WorldEditorState) {
    const toolType = this.getToolType(state);

    if (this.tool.getToolType() !== toolType) {
      const nextTool = this.getOrCreateTool(toolType);
      this.tool.stop();
      this.tool = nextTool;
      this.tool.start();
    }
  }

  abstract getToolType(editorState: WorldEditorState): T;
  abstract createTool(toolType: T): Tool<T, U>;

  private getOrCreateTool(toolType: T): Tool<T, U> {
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
