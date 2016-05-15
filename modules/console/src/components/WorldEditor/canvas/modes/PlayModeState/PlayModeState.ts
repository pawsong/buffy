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
  Action,
  SubscribeAction,
  UnsubscribeAction,
} from '../../../types';

import {
  CHANGE_PLAY_VIEW_MODE, ChangePlayViewModeAction,
} from '../../../actions';

import ModeState from '../ModeState';
import WorldEditorCanvas from '../../WorldEditorCanvas';

import createTool, { PlayModeTool, InitParams } from './tools';

class PlayModeState extends ModeState<PlayToolType, InitParams> {
  private stateLayer: StateLayer;
  private canvas: WorldEditorCanvas;
  private getFiles: () => SourceFileDB;
  private subscrbieAction: SubscribeAction;
  private unsubscrbieAction: UnsubscribeAction;

  constructor(getState: GetState, initParams: InitParams, getFiles: () => SourceFileDB, subscribeAction: SubscribeAction) {
    super(getState, initParams);
    this.canvas = initParams.view;
    this.stateLayer = initParams.stateLayer;
    this.getFiles = getFiles;
    this.subscrbieAction = subscribeAction;
  }

  getToolType(editorState: WorldEditorState): PlayToolType {
    return editorState.playMode.tool;
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
    this.canvas.connectToStateStore(this.stateLayer.store);

    this.unsubscrbieAction = this.subscrbieAction(action => this.handleActionDispatch(action));
  }

  handleActionDispatch(action: Action<any>) {
    switch(action.type) {
      case CHANGE_PLAY_VIEW_MODE: {
        const { viewMode } = <ChangePlayViewModeAction>action;
        this.canvas.applyCameraMode(viewMode);
        return;
      }
    }

    // if (this.state.editMode.playerId !== nextState.editMode.playerId) {
    //   const object = this.objectManager.objects[nextState.editMode.playerId];
    //   this.setCameraPosition(object.group.position);
    // }
  }

  handleLeave() {
    super.handleLeave();

    this.unsubscrbieAction();
    this.unsubscrbieAction = null;

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
