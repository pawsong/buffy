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

import { SourceFileDB } from '../Studio/types';

import { TOOLBAR_HEIGHT } from './Constants';

import generateObjectId from '../../utils/generateObjectId';

import {
  ToolType,
  Color,
  WorldEditorState,
  EditorMode,
  PlayModeState,
  CameraMode,
  Robot,
  Zone,
} from './types';

export { WorldEditorState };

interface WorldEditorProps extends React.Props<WorldEditor> {
  editorState: WorldEditorState;
  onFileChange: (id: string, state: WorldEditorState) => any;
  stateLayer: StateLayer;
  designManager: DesignManager;
  sizeVersion: number; // For resize
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

interface CreateStateOptions {
  recipe: string;
}

@pure
@connectTarget({
  panelTypes: PanelTypes,
  panelIds: Object.keys(Panels).map(key => Panels[key]),
  mapIdToLocalStorageKey: panelId => `worldeditor.panel.${panelId}`,
  limitTop: TOOLBAR_HEIGHT,
})
class WorldEditor extends React.Component<WorldEditorProps, WorldEditorOwnState> {
  static createState: (fileId: string, options: CreateStateOptions) => WorldEditorState;

  constructor(props, context) {
    super(props, context);
    this.state = {
      canvasElement: null,
    };
  }

  handleChangeState = (nextState: WorldEditorState) => {
    this.props.onFileChange(this.props.editorState.fileId, nextState);
  }

  renderContent() {
    switch(this.props.editorState.mode) {
      case EditorMode.EDIT: {
        return (
          <EditMode
            editorState={this.props.editorState}
            onChange={this.handleChangeState}
            files={this.props.files}
          />
        );
      }
      case EditorMode.PLAY: {
        return (
          <PlayMode
            canvasElement={this.state.canvasElement}
            playModeState={this.props.editorState.playMode}
            onChange={this.handleChangeState}
          />
        );
      }
    }

    return null;
  }

  handleEnterEditMode = () => {
    this.handleChangeState({
      mode: EditorMode.EDIT,
      cameraMode: CameraMode.ORHTOGRAPHIC,
    });
  }

  handleEnterPlayMode = () => {
    this.handleChangeState({
      mode: EditorMode.PLAY,
      playMode: PlayModeState.READY,
    });
  }

  render() {
    return (
      <div>
        <WorldEditorToolbar
          editorState={this.props.editorState}
          onEnterEditMode={this.handleEnterEditMode}
          onEnterPlayMode={this.handleEnterPlayMode}
        />
        <div style={styles.canvasContainer}>
          <Canvas
            editorState={this.props.editorState}
            onChange={this.handleChangeState}
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

WorldEditor.createState = (fileId: string, options: CreateStateOptions): WorldEditorState => {
  const zoneId = generateObjectId();

  const robotId1 = generateObjectId();

  const robot1: Robot = {
    id: robotId1,
    name: 'Robot 1',
    zone: zoneId,
    recipe: options.recipe,
    position: [3, 4, 3],
    direction: [0, 0, 1],
  };

  const robotId2 = generateObjectId();

  const robot2: Robot = {
    id: robotId2,
    name: 'Robot 2',
    zone: zoneId,
    recipe: options.recipe,
    position: [2, 4, 6],
    direction: [0, 0, 1],
  };

  // Initialize data
  const zone: Zone = {
    id: zoneId,
    name: 'Zone',
    size: [16, 16, 16],
  };

  return {
    fileId,
    mode: EditorMode.EDIT,
    playMode: PlayModeState.READY,
    cameraMode: CameraMode.ORHTOGRAPHIC,
    playerId: robot1.id,
    selectedTool: ToolType.move,
    brushColor: { r: 104, g: 204, b: 202 },
    robots: [robot1, robot2],
    zones: [zone],
  };
}

export default WorldEditor;
