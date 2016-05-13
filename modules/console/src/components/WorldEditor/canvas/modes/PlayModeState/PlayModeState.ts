import StateLayer from '@pasta/core/lib/StateLayer';

import {
  WorldEditorState,
  PlayToolType,
  GetState,
} from '../../../types';

import ModeState from '../ModeState';
import WorldEditorCanvas from '../../WorldEditorCanvas';

import createTool, { PlayModeTool, InitParams } from './tools';

class PlayModeState extends ModeState<PlayToolType, InitParams> {
  private stateLayer: StateLayer;
  private canvas: WorldEditorCanvas;

  constructor(getState: GetState, initParams: InitParams) {
    super(getState, initParams);
    this.canvas = initParams.view;
    this.stateLayer = initParams.stateLayer;
  }

  getToolType(editorState: WorldEditorState): PlayToolType {
    return editorState.playTool;
  }

  // Lazy getter
  createTool(toolType: PlayToolType): PlayModeTool {
    return createTool(toolType, this.getState, {
      view: this.canvas,
      stateLayer: this.stateLayer,
    });
  }

  handleEnter() {
    super.handleEnter();

    // TODO: Filter objects on current active map.
    Object.keys(this.stateLayer.store.objects).forEach(key => {
      const object = this.stateLayer.store.objects[key];
      this.stateLayer.store.watchObject(object);
    })
    this.canvas.connectToStateStore(this.stateLayer.store);
  }

  handleLeave() {
    super.handleLeave();

    // TODO: Think about nicer api for unwatching...
    Object.keys(this.stateLayer.store.objects).forEach(key => {
      const object = this.stateLayer.store.objects[key];
      this.stateLayer.store.unwatchObject(object);
    })
    this.canvas.disconnectFromStateStore();
  }
}

export default PlayModeState;
