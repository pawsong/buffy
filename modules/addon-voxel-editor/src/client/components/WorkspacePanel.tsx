import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import RaisedButton = require('material-ui/lib/raised-button');
import * as ReactDnd from 'react-dnd';
import objectAssign = require('object-assign');
import * as axios from 'axios';

import NotImplDialog from './dialogs/NotImplDialog';
import FileBrowserDialog from './dialogs/FileBrowserDialog';
import SaveDialog from './dialogs/SaveDialog';


import {
  PanelConstants,
  PanelStyles,
  wrapPanel
} from './Panel';

import * as WorkspaceActions from '../actions/workspace';


interface WorkspacePanelProps extends React.Props<WorkspacePanel> {
  workspace: any;
  voxel: any;
  left: number;
  top: number;
  zIndex: number;
  actions: any;
  connectDragPreview: ReactDnd.ConnectDragPreview;
  connectDragSource: ReactDnd.ConnectDragSource;
  isDragging: boolean;
}

class WorkspacePanel extends React.Component<WorkspacePanelProps, {
  showFileBrowserDialog?: boolean;
  showSaveDialog?: boolean;
  showNotImplDialog?: boolean;
}> {
  constructor(props) {
    super(props);
    this.state = {
      showNotImplDialog: false,
      showSaveDialog: false,
      showFileBrowserDialog: false,
    };
  }

  _handleOpen() {
    this.setState({ showFileBrowserDialog: true });
  };

  _handleNew() {
    this.setState({ showNotImplDialog: true });
  };

  _handleSave() {
    const { workspace } = this.props;
    const { name } = workspace;
    if (!name) {
      return this.setState({ showSaveDialog: true });
    }

    const voxels = this.props.voxel.present.data.toJSON();
    axios.put(`${CONFIG_API_SERVER_URL}/voxel-workspaces/me/${name}`, {
      data: JSON.stringify({ voxels }),
    }, { withCredentials: true });
  };

  _onSaveDialogClose(result) {
    this.setState({ showSaveDialog: false });
    if (result) { this._handleSave(); }
  };

  render() {
    const {
      left,
      top,
      zIndex,
      connectDragPreview,
      connectDragSource,
      isDragging,
    } = this.props;

    const opacity = isDragging ? PanelConstants.DRAGGING_OPACITY : 1;

    const previewStyle = objectAssign({
      zIndex, left, top, opacity,
    }, PanelStyles.root);

    return <div>
      {connectDragPreview(<div style={previewStyle}>
        {connectDragSource(<div style={PanelStyles.handle}>Workspace</div>)}
        <RaisedButton label="Open" secondary={true} onClick={this._handleOpen.bind(this)} />
        <RaisedButton label="New" secondary={true} onClick={this._handleNew.bind(this)}/>
        <RaisedButton label="Save" secondary={true} onClick={this._handleSave.bind(this)}/>
      </div>)}
      <FileBrowserDialog
        open={this.state.showFileBrowserDialog}
        actions={this.props.actions}
        onRequestClose={() => this.setState({ showFileBrowserDialog: false })}
      />
      <SaveDialog
        open={this.state.showSaveDialog}
        actions={this.props.actions}
        onRequestClose={this._onSaveDialogClose.bind(this)}
      />
      <NotImplDialog
        open={this.state.showNotImplDialog}
        onRequestClose={() => this.setState({ showNotImplDialog: false })}
      />
    </div>;
  };
};

export default wrapPanel(connect(state => ({
  voxel: state.voxel,
  workspace: state.workspace,
}), dispatch => ({
  actions: bindActionCreators(objectAssign({},
    WorkspaceActions
  ), dispatch),
}))(WorkspacePanel));
