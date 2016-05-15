import * as React from 'react';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./EditMode.css');

import {
  Color,
  DispatchAction,
  EditToolType,
  WorldEditorState,
} from '../../types';

import {
  changePaletteColor,
  changeEditTool,
  removeRobot,
} from '../../actions';

import { connectTarget } from '../../../Panel';
import { PanelTypes, Panels } from '../../panel';

import { SourceFileDB } from '../../../Studio/types';

import { Robot } from '../../types';

import RobotPanel from './RobotPanel';
import ToolsPanel from './ToolsPanel';

interface EditModeProps extends React.Props<EditMode> {
  editorState: WorldEditorState;
  dispatchAction: DispatchAction;
  files: SourceFileDB;
}

@withStyles(styles)
class EditMode extends React.Component<EditModeProps, {}> {
  handleRobotRemove(robotId: string) {
    this.props.dispatchAction(removeRobot(robotId));
  }

  handlePaletteColorChange(color: Color) {
    this.props.dispatchAction(changePaletteColor(color));
  }

  handleToolChange(tool: EditToolType) {
    this.props.dispatchAction(changeEditTool(tool));
  }

  render() {
    return (
      <div>
        <RobotPanel
          robots={this.props.editorState.editMode.robots}
          files={this.props.files}
          playerId={this.props.editorState.editMode.playerId}
          onPlayerChange={playerId => {}}
          onRobotRemove={robotId => this.handleRobotRemove(robotId)}
        />
        <ToolsPanel
          changePaletteColor={brushColor => this.handlePaletteColorChange(brushColor)}
          paletteColor={this.props.editorState.editMode.paletteColor}
          selectedTool={this.props.editorState.editMode.tool}
          selectTool={editTool => this.handleToolChange(editTool)}
        />
      </div>
    );
  }
}

export default EditMode;
