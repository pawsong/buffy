import * as React from 'react';
const pure = require('recompose/pure').default;

import StateLayer from '@pasta/core/lib/StateLayer';
import { EventSubscription } from 'fbemitter';

import DesignManager from '../../DesignManager';

import MapInfo from './components/MapInfo';
import Canvas from './components/Canvas';
import Tools from './components/Tools';
import ZonePanel from './components/ZonePanel';
import RobotPanel from './components/RobotPanel';

import { connectTarget } from '../Panel';
import { RobotInstance, ZoneInstance, SourceFileDB } from '../Studio/types';

import { ToolType, Color, WorldEditorState } from './types';
export { WorldEditorState };

const objectAssign = require('object-assign');

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

interface GameOwnState {
  mapName: string;
}

@pure
@connectTarget([
  RobotPanel.PANEL_ID,
  ZonePanel.PANEL_ID,
], panelId => `worldeditor.panel.${panelId}`)
class WorldEditor extends React.Component<WorldEditorProps, GameOwnState> {
  static createState: (playerId: string) => WorldEditorState;

  token: EventSubscription;

  constructor(props, context) {
    super(props, context);
    this.state = {
      mapName: '',
    };
  }

  componentDidMount() {
    const onResync = () => {
      const object = this.props.stateLayer.store.findObject(this.props.editorState.playerId);
      this.setState({ mapName: object.zone.id });
    };

    this.token = this.props.stateLayer.store.subscribe.resync(onResync);
    onResync();
  }

  componentWillUnmount() {
    this.token.remove();
  }

  handleChangeState(nextState: WorldEditorState) {
    this.props.onChange(objectAssign({}, this.props.editorState, nextState));
  }

  render() {
    return (
      <div>
        <MapInfo mapName={this.state.mapName} />
        <Canvas
          editorState={this.props.editorState}
          sizeVersion={this.props.sizeVersion}
          stateLayer={this.props.stateLayer}
          designManager={this.props.designManager}
        />
        <Tools
          selectedTool={this.props.editorState.selectedTool}
          brushColor={this.props.editorState.brushColor}
          changeTool={selectedTool => this.handleChangeState({ selectedTool })}
          changeBrushColor={brushColor => this.handleChangeState({ brushColor })}
        />
        <RobotPanel
          robots={this.props.robots}
          files={this.props.files}
          onPlayerChange={playerId => this.handleChangeState({ playerId })}
        />
        <ZonePanel
          zones={this.props.zones}
        />
        {this.props.children}
      </div>
    );
  }
}

WorldEditor.createState = (playerId: string): WorldEditorState => {
  return {
    playerId: playerId,
    selectedTool: ToolType.move,
    brushColor: { r: 104, g: 204, b: 202 },
  };
}

export default WorldEditor;
