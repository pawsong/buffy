import * as React from 'react';
const pure = require('recompose/pure').default;

import StateLayer from '@pasta/core/lib/StateLayer';
const objectAssign = require('object-assign');

import * as ndarray from 'ndarray';

import {
  changeEditorMode,
  runScript,
  stopScript,
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

import { saga, SagaProps, ImmutableTask } from '../../saga';
import { runBlocklyWorkspace, CompiledCodes } from './sagas';

import { compileBlocklyXml } from '../../blockly/utils';

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
  SubscribeAction,
} from './types';

import { rootReducer } from './reducers';

export { WorldEditorState };

interface WorldEditorProps extends React.Props<WorldEditor>, SagaProps {
  editorState: WorldEditorState;
  onChange: (state: WorldEditorState, callback?: () => any) => any;
  stateLayer: StateLayer;
  modelManager: ModelManager;
  sizeVersion: number; // For resize
  files: SourceFileDB;
  run?: ImmutableTask<any>;
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
@saga({
  run: runBlocklyWorkspace,
})
class WorldEditor extends React.Component<WorldEditorProps, WorldEditorOwnState> {
  static createState: (fileId: string, options: CreateStateOptions) => WorldEditorState;

  actionListeners: ActionListener[];

  private sandbox: Sandbox;

  constructor(props: WorldEditorProps, context) {
    super(props, context);
    this.state = {
      canvasElement: null,
    };
    this.actionListeners = [];

    this.sandbox = new Sandbox(props.stateLayer);
  }

  subscribeAction: SubscribeAction = (listener) => {
    this.actionListeners.push(listener);
    return () => {
      const index = this.actionListeners.indexOf(listener);
      if (index !== -1) this.actionListeners.splice(index, 1);
    };
  }

  dispatchAction = (action: Action<any>, callback?: () => any) => {
    const nextState = rootReducer(this.props.editorState, action);
    this.actionListeners.forEach(listener => listener(action));
    this.props.onChange(nextState, callback);
  }

  renderContent() {
    switch(this.props.editorState.common.mode) {
      case EditorMode.EDIT: {
        return (
          <EditMode
            modelManager={this.props.modelManager}
            editorState={this.props.editorState}
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
    console.log('run!');
    this.dispatchAction(runScript(), () => {
      console.log('dispatched');

      const robots = Object.keys(this.props.editorState.editMode.robots).map(robotId => {
        return this.props.editorState.editMode.robots[robotId];
      });

      // Find robots
      const recipes: { [index: string]: RecipeEditorState } = {};
      robots.forEach(robot => {
        recipes[robot.recipe] = this.props.files[robot.recipe].state;
      });

      const codesSet = {};
      Object.keys(recipes).forEach(robotId => {
        const robotState = recipes[robotId];
        robotState.codes.forEach(code => codesSet[code] = true);
      });

      const codes: CompiledCodes = {};
      Object.keys(codesSet).map(codeId => {
        const codeState = this.props.files[codeId].state;
        codes[codeId] = compileBlocklyXml(codeState.blocklyXml);
      });

      this.props.runSaga(this.props.run, this.sandbox, codes, robots.map(instance => {
        const recipe = recipes[instance.recipe];
        return {
          objectId: instance.id,
          codeIds: recipe.codes,
        };
      }));
    });
  }

  handleScriptStop = () => {
    this.props.cancelSaga(this.props.run);
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
            dispatchAction={this.dispatchAction}
            subscribeAction={this.subscribeAction}
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
  const size: [number, number, number] = [16, 16, 16];
  const zone: Zone = {
    id: zoneId,
    name: 'Zone',
    size,
    blocks: ndarray(new Int32Array(size[0] * size[1] * size[2]), size),
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

  return {
    common: {
      fileId,
      mode: EditorMode.EDIT,
    },
    editMode: {
      tool: EditToolType.MOVE,
      playerId: robot1.id,
      robots: {
        [robot1.id]: robot1,
        [robot2.id]: robot2,
      },
      zones: {
        [zone.id]: zone,
      },
      activeZoneId: zone.id,
      paletteColor: { r: 104, g: 204, b: 202 },
      addRobotRecipeId: '',
      toolToRestore: EditToolType.MOVE,
      scriptIsRunning: false,
    },
    playMode: {
      state: PlayState.READY,
      tool: PlayToolType.MOVE,
      viewMode: ViewMode.BIRDS_EYE,
    },
  };
}

export default WorldEditor;
