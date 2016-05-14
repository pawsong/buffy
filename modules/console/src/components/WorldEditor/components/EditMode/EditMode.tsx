import * as React from 'react';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./EditMode.css');

import {
  WorldEditorState,
} from '../../types';

import { connectTarget } from '../../../Panel';
import { PanelTypes, Panels } from '../../panel';

import { SourceFileDB } from '../../../Studio/types';

import RobotPanel from './RobotPanel';
import ZonePanel from './ZonePanel';
import ToolsPanel from './ToolsPanel';

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
        <RobotPanel
          robots={this.props.editorState.robots}
          files={this.props.files}
          playerId={this.props.editorState.playerId}
          onPlayerChange={playerId => this.props.onChange({ playerId })}
        />
        <ZonePanel
          zones={this.props.editorState.zones}
        />
        <ToolsPanel
          changePaletteColor={brushColor => this.props.onChange({ brushColor })}
          paletteColor={this.props.editorState.brushColor}
          selectedTool={this.props.editorState.editTool}
          selectTool={editTool => this.props.onChange({ editTool })}
        />
      </div>
    );
  }
}

export default EditMode;
