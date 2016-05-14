import StateLayer from '@pasta/core/lib/StateLayer';
import * as ndarray from 'ndarray';

import LocalServer from '../../../../../LocalServer';

import {
  SourceFileDB,
} from '../../../../Studio/types';

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
  private getFiles: () => SourceFileDB;

  constructor(getState: GetState, initParams: InitParams, getFiles: () => SourceFileDB) {
    super(getState, initParams);
    this.canvas = initParams.view;
    this.stateLayer = initParams.stateLayer;
    this.getFiles = getFiles;
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

    // Init data

    const files = this.getFiles();
    const { zones, robots, playerId } = this.getState();

    const server = <LocalServer>this.stateLayer.store;
    server.initialize(files, zones, robots);
    server.start();

    // Init view

    // TODO: Filter objects on current active map.
    Object.keys(this.stateLayer.store.objects).forEach(key => {
      const object = this.stateLayer.store.objects[key];
      this.stateLayer.store.watchObject(object);
    })
    this.canvas.connectToStateStore(this.stateLayer.store);
  }

  handleLeave() {
    super.handleLeave();

    const server = <LocalServer>this.stateLayer.store;
    server.stop();

    // TODO: Think about nicer api for unwatching...
    Object.keys(this.stateLayer.store.objects).forEach(key => {
      const object = this.stateLayer.store.objects[key];
      this.stateLayer.store.unwatchObject(object);
    })
    this.canvas.disconnectFromStateStore();
  }
}

export default PlayModeState;
