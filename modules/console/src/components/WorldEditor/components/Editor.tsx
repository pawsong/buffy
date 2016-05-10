import * as React from 'react';

import Tools from './Tools';
import RobotPanel from './RobotPanel';
import ZonePanel from './ZonePanel';

import {
  WorldEditorState,
} from '../types';

import { connectTarget } from '../../Panel';
import { PanelTypes, Panels } from '../panel';

import { RobotInstance, ZoneInstance, SourceFileDB } from '../../Studio/types';

interface EditorProps extends React.Props<Editor> {
  editorState: WorldEditorState;
  onChange: (gameState: WorldEditorState) => any;
  robots: RobotInstance[];
  zones: ZoneInstance[];
  files: SourceFileDB;
}

class Editor extends React.Component<EditorProps, void> {
  render() {
    return (
      <div>
        <Tools
          selectedTool={this.props.editorState.selectedTool}
          brushColor={this.props.editorState.brushColor}
          changeTool={selectedTool => this.props.onChange({ selectedTool })}
          changeBrushColor={brushColor => this.props.onChange({ brushColor })}
        />
        <RobotPanel
          robots={this.props.robots}
          files={this.props.files}
          playerId={this.props.editorState.playerId}
          onPlayerChange={playerId => this.props.onChange({ playerId })}
        />
        <ZonePanel
          zones={this.props.zones}
        />
      </div>
    );
  }
}

export default Editor;
