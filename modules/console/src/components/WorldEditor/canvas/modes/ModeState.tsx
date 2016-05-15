import Fsm, { State } from '../../../../libs/Fsm';
import {
  WorldEditorState,
  EditorMode,
  GetState,
} from '../../types';
import WorldEditorCanvasTool from './WorldEditorCanvasTool';
import {
  CHANGE_MODE,
  CHANGE_STATE,
  MOUSE_DOWN,
  MOUSE_UP,
} from './Events';
import WorldEditorCanvas from '../WorldEditorCanvas';

abstract class ModeState<T, U> extends State {
  tool: WorldEditorCanvasTool<T, U>;
  getState: GetState;

  private cachedTools: { [index: string]: WorldEditorCanvasTool<T, U> };

  constructor(getState: GetState, initParams: U) {
    super({
      [CHANGE_MODE]: (mode: EditorMode) => ({ state: EditorMode[mode] }),
      [State.EVENT_ENTER]: () => this.handleEnter(),
      [State.EVENT_LEAVE]: () => this.handleLeave(),
      [CHANGE_STATE]: (state: WorldEditorState) => this.handleStateChange(state),
      [MOUSE_DOWN]: (event: MouseEvent) => this.handleMouseDown(event),
      [MOUSE_UP]: (event: MouseEvent) => this.handleMouseUp(event),
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

    this.tool.onStart();
    this.handleStateChange(state);
  }

  handleLeave() {
    this.tool.onStop();
  }

  handleStateChange(state: WorldEditorState) {
    const toolType = this.getToolType(state);

    if (this.tool.getToolType() !== toolType) {
      const nextTool = this.getOrCreateTool(toolType);
      this.tool.onStop();
      this.tool = nextTool;
      this.tool.onStart();
    }

    this.tool.updateProps(state);
  }

  handleMouseDown(event: MouseEvent) {
    this.tool.onMouseUp({ event });
  }

  handleMouseUp(event: MouseEvent) {
    this.tool.onMouseDown({ event });
  }

  abstract getToolType(editorState: WorldEditorState): T;
  abstract createTool(toolType: T): WorldEditorCanvasTool<T, U>;

  private getOrCreateTool(toolType: T): WorldEditorCanvasTool<T, U> {
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
