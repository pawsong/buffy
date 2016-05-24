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
  private component: PlayModeComponent;

  private initParams: InitParams;

  constructor(getState: GetState, initParams: InitParams, getFiles: () => SourceFileDB) {
    super(initParams.view, getState, initParams.stateLayer, getFiles);
    this.initParams = initParams;
    this.component = new PlayModeComponent(initParams.view);
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

    this.startLocalServerMode();
    this.component.start(this.getState());
  }

  handleStateChange(state: WorldEditorState) {
    super.handleStateChange(state);
    this.component.updateProps(state);
  }

  handleLeave() {
    this.component.stop();
    this.stopLocalServerMode();
    super.handleLeave();
  }
}

export default PlayModeState;
