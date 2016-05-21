import StateLayer from '@pasta/core/lib/StateLayer';
import { Schema, SchemaType } from '@pasta/helper/lib/diff';
import * as ndarray from 'ndarray';

import LocalServer from '../../../../../LocalServer';

import {
  SourceFileDB,
} from '../../../../Studio/types';

import SimpleComponent from '../../../../../libs/SimpleComponent';

import {
  WorldEditorState,
  PlayToolType,
  GetState,
  Action,
  ViewMode,
} from '../../../types';

import {
  CHANGE_PLAY_VIEW_MODE, ChangePlayViewModeAction,
} from '../../../actions';

import ModeState from '../ModeState';
import WorldEditorCanvas from '../../WorldEditorCanvas';

import createTool, { PlayModeTool, InitParams } from './tools';

interface PlayModeComponentProps {
  viewMode: ViewMode;
}

class PlayModeComponent extends SimpleComponent<WorldEditorState, PlayModeComponentProps> {
  constructor(private canvas: WorldEditorCanvas) {
    super();
  }

  getPropsSchema(): Schema {
    return {
      type: SchemaType.OBJECT,
      properties: {
        viewMode: { type: SchemaType.ANY },
      },
    };
  }

  mapProps(state: WorldEditorState): PlayModeComponentProps {
    return {
      viewMode: state.playMode.viewMode,
    };
  }

  componentDidUpdate(prevProps: PlayModeComponentProps) {
    if (prevProps.viewMode !== this.props.viewMode) {
      this.canvas.applyCameraMode(this.props.viewMode);
    }
  }
}

class PlayModeState extends ModeState<PlayToolType, InitParams> {
  private stateLayer: StateLayer;
  private canvas: WorldEditorCanvas;
  private getFiles: () => SourceFileDB;
  private component: PlayModeComponent;

  private initParams: InitParams;

  constructor(getState: GetState, initParams: InitParams, getFiles: () => SourceFileDB) {
    super(getState);
    this.initParams = initParams;
    this.canvas = initParams.view;
    this.stateLayer = initParams.stateLayer;
    this.getFiles = getFiles;
    this.component = new PlayModeComponent(this.canvas);
  }

  getToolType(editorState: WorldEditorState): PlayToolType {
    return editorState.playMode.tool;
  }

  // Lazy getter
  createTool(toolType: PlayToolType): PlayModeTool<any> {
    return createTool(toolType, this.getState, this.initParams);
  }

  handleEnter() {
    super.handleEnter();

    // Init data

    const recipeFiles = this.getFiles();
    const { zones, robots, playerId } = this.getState().editMode;

    const server = <LocalServer>this.stateLayer.store;
    server.initialize(recipeFiles, zones, robots);
    server.start();

    // Init view

    // TODO: Filter objects on current active map.
    Object.keys(this.stateLayer.store.objects).forEach(key => {
      const object = this.stateLayer.store.objects[key];
      this.stateLayer.store.watchObject(object);
    })
    this.canvas.connectToStateStore(this.stateLayer.store);

    this.component.start(this.getState());
  }

  handleStateChange(state: WorldEditorState) {
    super.handleStateChange(state);
    this.component.updateProps(state);
  }

  handleLeave() {
    this.component.stop();

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
