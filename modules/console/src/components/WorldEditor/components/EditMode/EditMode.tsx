import * as React from 'react';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./EditMode.css');

import {
  WorldEditorState,
} from '../../types';

import { connectTarget } from '../../../Panel';
import { PanelTypes, Panels } from '../../panel';

import { SourceFileDB } from '../../../Studio/types';

import Tools from './Tools';
import RobotPanel from './RobotPanel';
import ZonePanel from './ZonePanel';

interface EditModeProps extends React.Props<EditMode> {
  editorState: WorldEditorState;
  onChange: (gameState: WorldEditorState) => any;
  files: SourceFileDB;
}

@withStyles(styles)
class EditMode extends React.Component<EditModeProps, {}> {
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
          robots={this.props.editorState.robots}
          files={this.props.files}
          playerId={this.props.editorState.playerId}
          onPlayerChange={playerId => this.props.onChange({ playerId })}
        />
        <ZonePanel
          zones={this.props.editorState.zones}
        />
      </div>
    );
  }
}

export default EditMode;
