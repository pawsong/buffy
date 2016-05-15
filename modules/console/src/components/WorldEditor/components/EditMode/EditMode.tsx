import * as React from 'react';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./EditMode.css');

import AddRobotDialog from './containers/AddRobotDialog';

import {
  Color,
  DispatchAction,
  EditToolType,
  WorldEditorState,
} from '../../types';

import {
  changePaletteColor,
  changeEditTool,
  requestAddRobot,
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

interface EditModeState {
  addRobotDialogOpen: boolean;
}

@withStyles(styles)
class EditMode extends React.Component<EditModeProps, EditModeState> {
  constructor(props) {
    super(props);
    this.state = {
      addRobotDialogOpen: false,
    };
  }

  handleRobotRemove(robotId: string) {
    this.props.dispatchAction(removeRobot(robotId));
  }

  handlePaletteColorChange(color: Color) {
    this.props.dispatchAction(changePaletteColor(color));
  }

  handleToolChange(tool: EditToolType) {
    this.props.dispatchAction(changeEditTool(tool));
  }

  handleRobotAdd(recipeId: string) {
    this.setState({ addRobotDialogOpen: false });
    this.props.dispatchAction(requestAddRobot(recipeId));
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
          onAddRobotButtonClick={() => this.setState({ addRobotDialogOpen: true })}
        />
        <ToolsPanel
          changePaletteColor={brushColor => this.handlePaletteColorChange(brushColor)}
          paletteColor={this.props.editorState.editMode.paletteColor}
          selectedTool={this.props.editorState.editMode.tool}
          selectTool={editTool => this.handleToolChange(editTool)}
        />
        <AddRobotDialog
          open={this.state.addRobotDialogOpen}
          onRequestClose={() => this.setState({ addRobotDialogOpen: false })}
          files={this.props.files}
          onSubmit={robotId => this.handleRobotAdd(robotId)}
        />
      </div>
    );
  }
}

export default EditMode;
