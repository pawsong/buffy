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
  WorldState,
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

class PlayModeComponent extends SimpleComponent<WorldState, PlayModeComponentProps> {
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

  mapProps(state: WorldState): PlayModeComponentProps {
    return {
      viewMode: state.editor.playMode.viewMode,
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

  constructor(initParams: InitParams, getFiles: () => SourceFileDB, state: WorldState) {
    super(initParams.view, initParams.stateLayer, getFiles, state);
    this.initParams = initParams;
    this.component = new PlayModeComponent(initParams.view);
  }

  getToolType(editorState: WorldEditorState): PlayToolType {
    return editorState.playMode.tool;
  }

  // Lazy getter
  createTool(toolType: PlayToolType): PlayModeTool<any> {
    return createTool(toolType, this.initParams);
  }

  onEnter(state: WorldState) {
    super.onEnter(state);

    this.startLocalServerMode();
    this.component.start(state);
  }

  onStateChange(state: WorldState) {
    super.onStateChange(state);
    this.component.updateProps(state);
  }

  onLeave() {
    this.component.stop();
    this.stopLocalServerMode();
    super.onLeave();
  }
}

export default PlayModeState;
