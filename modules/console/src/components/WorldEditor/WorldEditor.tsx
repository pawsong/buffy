import * as React from 'react';
const pure = require('recompose/pure').default;

import * as pako from 'pako';

import StateLayer from '@pasta/core/lib/StateLayer';
import { createState as createUndoableState } from '@pasta/helper/lib/undoable';
const objectAssign = require('object-assign');

import * as ndarray from 'ndarray';

import {
  changeEditorMode,
  runScript,
  stopScript,
  changeActiveZone,
} from './actions';

import { Sandbox, Scripts } from '../../sandbox';
import ModelManager from '../../canvas/ModelManager';

import { RecipeEditorState } from '../RecipeEditor';

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
  PlayState,
  ViewMode,
  EditToolType,
  PlayToolType,
  Color,
  WorldEditorState,
  EditorMode,
  PlayModeState,
  CameraMode,
  Robot,
  Zone,
  Action,
  DispatchAction,
  ActionListener,
  FileState,
  SerializedData,
} from './types';

import fileReducer from './reducers/file';
import editorReducer from './reducers/editor';

export { WorldEditorState };

interface WorldEditorProps extends React.Props<WorldEditor> {
  editorState: WorldEditorState;
  onEditorStateChange: (state: WorldEditorState) => any;
  fileState: FileState;
  onFileStateChanage: (fileState: FileState) => any;

  stateLayer: StateLayer;
  modelManager: ModelManager;
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
  static createEditorState: (activeZoneId: string) => WorldEditorState;
  static createFileState: (fileId: string, options: CreateStateOptions) => FileState;
  static isModified: (lhs: FileState, rhs: FileState) => boolean;

  static serialize: (fileState: FileState) => SerializedData;
  static deserialize: (data: SerializedData) => FileState;

  private sandbox: Sandbox;

  constructor(props: WorldEditorProps, context) {
    super(props, context);
    this.state = {
      canvasElement: null,
    };

    this.sandbox = new Sandbox(props.stateLayer);
  }

  dispatchAction = (action: Action<any>) => {
    const nextEditorState = editorReducer(this.props.editorState, action);
    if (this.props.editorState !== nextEditorState) this.props.onEditorStateChange(nextEditorState);

    const nextFileState = fileReducer(this.props.fileState, action);
    if (this.props.fileState !== nextFileState) this.props.onFileStateChanage(nextFileState);
  }

  renderContent() {
    switch(this.props.editorState.common.mode) {
      case EditorMode.EDIT: {
        return (
          <EditMode
            modelManager={this.props.modelManager}
            fileState={this.props.fileState}
            editorState={this.props.editorState}
            worldData={this.props.fileState.present.data}
            dispatchAction={this.dispatchAction}
            files={this.props.files}
          />
        );
      }
      case EditorMode.PLAY: {
        return (
          <PlayMode
            canvasElement={this.state.canvasElement}
            playModeState={this.props.editorState.playMode}
            dispatchAction={this.dispatchAction}
          />
        );
      }
    }

    return null;
  }

  handleEnterEditMode = () => {
    this.dispatchAction(changeEditorMode(EditorMode.EDIT));
  }

  handleEnterPlayMode = () => {
    this.dispatchAction(changeEditorMode(EditorMode.PLAY));
  }

  handleScriptRun = () => {
    this.dispatchAction(runScript());
  }

  handleScriptStop = () => {
    this.dispatchAction(stopScript());
  }

  render() {
    return (
      <div>
        <WorldEditorToolbar
          editorState={this.props.editorState}
          onEnterEditMode={this.handleEnterEditMode}
          onEnterPlayMode={this.handleEnterPlayMode}
          onScriptRun={this.handleScriptRun}
          onScriptStop={this.handleScriptStop}
        />
        <div style={styles.canvasContainer}>
          <Canvas
            editorState={this.props.editorState}
            fileState={this.props.fileState}
            dispatchAction={this.dispatchAction}
            sizeVersion={this.props.sizeVersion}
            stateLayer={this.props.stateLayer}
            modelManager={this.props.modelManager}
            registerElement={canvasElement => this.setState({ canvasElement })}
            files={this.props.files}
          />
          {this.renderContent()}
        </div>
      </div>
    );
  }
}

function rgbToHex({ r, g, b }) {
  return (1 << 24) /* Used by mesher */ | (r << 16) | (g << 8) | b;
}

WorldEditor.createEditorState = (activeZoneId: string): WorldEditorState => {
  return editorReducer(undefined, changeActiveZone(activeZoneId));
}

WorldEditor.createFileState = (fileId: string, options: CreateStateOptions): FileState => {
  const zoneId = generateObjectId();

  const robotId1 = generateObjectId();

  const robot1: Robot = {
    id: robotId1,
    name: 'Robot 1',
    zone: zoneId,
    recipe: options.recipe,
    position: [0, 3, 0],
    direction: [0, 0, 1],
  };

  const robotId2 = generateObjectId();

  const robot2: Robot = {
    id: robotId2,
    name: 'Robot 2',
    zone: zoneId,
    recipe: options.recipe,
    position: [1, 3, 3],
    direction: [0, 0, 1],
  };

  const robots: { [index: string]: Robot } = {
    [robot1.id]: robot1,
    [robot2.id]: robot2,
  };

  // Initialize data
  const size: [number, number, number] = [16, 16, 16];
  const zone: Zone = {
    id: zoneId,
    name: 'Zone',
    size,
    blocks: ndarray(new Int32Array(size[0] * size[1] * size[2]), size),
  };

  const zones: { [index: string]: Zone } = {
    [zone.id]: zone,
  };

  const soilColor = rgbToHex({ r: 100, g: 100, b: 0 });
  const grassColor = rgbToHex({ r: 0, g: 100, b: 0 });

  for (let x = 0; x < size[0]; ++x) {
    for (let z = 0; z < size[2]; ++z) {
      let y;
      for (y = 0; y < 2; ++y) zone.blocks.set(x, y, z, soilColor);
      zone.blocks.set(x, y, z, grassColor);
    }
  }

  return createUndoableState({
    playerId: robot1.id,
    robots,
    zones,
  });
}

WorldEditor.isModified = (lhs, rhs) => {
  return lhs.present.data !== rhs.present.data;
};

WorldEditor.serialize = (fileState: FileState) => {
  const { data } = fileState.present;
  return {
    playerId: data.playerId,
    robots: Object.keys(data.robots).map(id => data.robots[id]),
    zones: Object.keys(data.zones).map(id => {
      const zone = data.zones[id];

      return {
        id: zone.id,
        name: zone.name,
        shape: zone.blocks.shape,
        blocks: pako.deflate(zone.blocks.data.buffer) as any,
      };
    }),
  };
};

WorldEditor.deserialize = (data: SerializedData) => {
  const robots: { [index: string]: Robot } = {};
  data.robots.forEach(robot => {
    robots[robot.id] = robot;
  })

  const zones: { [index: string]: Zone } = {};
  data.zones.forEach(zone => {
    const blocksData = new Int32Array(pako.inflate(zone.blocks).buffer);
    zones[zone.id] = {
      id: zone.id,
      name: zone.name,
      size: zone.shape,
      blocks: ndarray(blocksData, zone.shape),
    };
  });

  return createUndoableState({
    playerId: data.playerId,
    robots,
    zones,
  });
};

export default WorldEditor;
