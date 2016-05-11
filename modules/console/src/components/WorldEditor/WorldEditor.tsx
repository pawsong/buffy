import * as React from 'react';
const pure = require('recompose/pure').default;

import StateLayer from '@pasta/core/lib/StateLayer';
const objectAssign = require('object-assign');

import DesignManager from '../../canvas/DesignManager';

import { connectTarget } from '../Panel';
import { PanelTypes, Panels } from './panel';

import MapInfo from './components/MapInfo';
import Canvas from './components/Canvas';
import EditMode from './components/EditMode';
import PlayMode from './components/PlayMode';

import WorldEditorToolbar from './components/WorldEditorToolbar';

import { RobotInstance, ZoneInstance, SourceFileDB } from '../Studio/types';

import { TOOLBAR_HEIGHT } from './Constants';

import {
  ToolType,
  Color,
  WorldEditorState,
  EditorMode,
  PlayModeState,
  CameraMode,
} from './types';

export { WorldEditorState };

interface WorldEditorProps extends React.Props<WorldEditor> {
  editorState: WorldEditorState;
  onChange: (gameState: WorldEditorState) => any;
  stateLayer: StateLayer;
  designManager: DesignManager;
  sizeVersion: number; // For resize

  robots: RobotInstance[];
  zones: ZoneInstance[];

  files: SourceFileDB;
}

const styles = {
  canvasContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
};

interface WorldEditorOwnState {
  canvasElement: HTMLElement;
}

@pure
@connectTarget({
  panelTypes: PanelTypes,
  panelIds: Object.keys(Panels).map(key => Panels[key]),
  mapIdToLocalStorageKey: panelId => `worldeditor.panel.${panelId}`,
  limitTop: TOOLBAR_HEIGHT,
})
class WorldEditor extends React.Component<WorldEditorProps, WorldEditorOwnState> {
  static createState: (playerId: string) => WorldEditorState;

  constructor(props, context) {
    super(props, context);
    this.state = {
      canvasElement: null,
    };
  }

  handleChangeState(nextState: WorldEditorState) {
    this.props.onChange(objectAssign({}, this.props.editorState, nextState));
  }

  renderContent() {
    switch(this.props.editorState.mode) {
      case EditorMode.EDIT: {
        return (
          <EditMode
            editorState={this.props.editorState}
            onChange={state => this.handleChangeState(state)}
            robots={this.props.robots}
            zones={this.props.zones}
            files={this.props.files}
          />
        );
      }
      case EditorMode.PLAY: {
        return (
          <PlayMode
            canvasElement={this.state.canvasElement}
            playModeState={this.props.editorState.playMode}
            onChange={state => this.handleChangeState(state)}
          />
        );
      }
    }

    return null;
  }

  render() {
    return (
      <div>
        <WorldEditorToolbar
          editorState={this.props.editorState}
          onChange={state => this.handleChangeState(state)}
        />
        <div style={styles.canvasContainer}>
          <Canvas
            editorState={this.props.editorState}
            onChange={state => this.handleChangeState(state)}
            sizeVersion={this.props.sizeVersion}
            stateLayer={this.props.stateLayer}
            designManager={this.props.designManager}
            registerElement={canvasElement => this.setState({ canvasElement })}
          />
          {this.renderContent()}
        </div>
      </div>
    );
  }
}

WorldEditor.createState = (playerId: string): WorldEditorState => {
  return {
    mode: EditorMode.EDIT,
    playMode: PlayModeState.READY,
    cameraMode: CameraMode.ORHTOGRAPHIC,
    playerId: playerId,
    selectedTool: ToolType.move,
    brushColor: { r: 104, g: 204, b: 202 },
  };
}

export default WorldEditor;
