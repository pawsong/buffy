import * as React from 'react';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./EditMode.css');

import AddRobotDialog from './containers/AddRobotDialog';

import {
  Color,
  DispatchAction,
  EditToolType,
  WorldEditorState,
  WorldData,
  FileState,
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
import HistoryPanel from './HistoryPanel';

import ModelManager from '../../../../canvas/ModelManager';

interface EditModeProps extends React.Props<EditMode> {
  editorState: WorldEditorState;
  worldData: WorldData;
  fileState: FileState;
  dispatchAction: DispatchAction;
  files: SourceFileDB;
  modelManager: ModelManager;
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
    if (this.props.editorState.editMode.scriptIsRunning === true) return null;

    return (
      <div>
        <RobotPanel
          modelManager={this.props.modelManager}
          robots={this.props.worldData.robots}
          files={this.props.files}
          playerId={this.props.worldData.playerId}
          onPlayerChange={playerId => {}}
          onRobotRemove={robotId => this.handleRobotRemove(robotId)}
          onAddRobotButtonClick={() => this.setState({ addRobotDialogOpen: true })}
        />
        <HistoryPanel
          file={this.props.fileState}
          dispatchAction={this.props.dispatchAction}
        />
        <ToolsPanel
          changePaletteColor={brushColor => this.handlePaletteColorChange(brushColor)}
          paletteColor={this.props.editorState.editMode.paletteColor}
          selectedTool={this.props.editorState.editMode.tool}
          selectTool={editTool => this.handleToolChange(editTool)}
        />
        <AddRobotDialog
          modelManager={this.props.modelManager}
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
