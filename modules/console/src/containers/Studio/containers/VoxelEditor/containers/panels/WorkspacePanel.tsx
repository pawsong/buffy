import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { call, put, select } from 'redux-saga/effects';
import RaisedButton = require('material-ui/lib/raised-button');
import * as ReactDnd from 'react-dnd';
import objectAssign = require('object-assign');
import * as axios from 'axios';

import { State } from '../../../../../../reducers';
import { WorkspaceState, VoxelState } from '../../../../../../reducers/voxelEditor';

import { saga, SagaProps, ImmutableTask, request } from '../../../../../../saga';

import {
  updateWorkspaceBrowser, UpdateWorkspaceBrowserQuery,
  updateSaveDialog, UpdateSaveDialogQuery,
  showNotImplDialog,
} from '../../../../../../actions/voxelEditor';

import {
  pushSnackbar, PushSnackbarQuery,
} from '../../../../../../actions/snackbar';

import NotImplDialog from '../dialogs/NotImplDialog';
import SaveDialog from '../dialogs/SaveDialog';

import {
  PanelConstants,
  PanelProps,
  PanelStyles,
  wrapPanel
} from './Panel';

/*
 * Container
 */

interface WorkspacePanelProps extends PanelProps<WorkspacePanel>, SagaProps {
  notImplDialogOpened?: boolean;
  updateWorkspaceBrowser?: (query: UpdateWorkspaceBrowserQuery) => any;
  updateSaveDialog?: (query: UpdateSaveDialogQuery) => any;
  showNotImplDialog?: (show: boolean) => any;
  workspace?: WorkspaceState;
  save?: ImmutableTask<any>;

  connectDragPreview?: ReactDnd.ConnectDragPreview;
  connectDragSource?: ReactDnd.ConnectDragSource;
  isDragging?: boolean;
}

@wrapPanel
@saga({
  save: function* (name) {
    const voxel: VoxelState = yield select<State>(state => state.voxelEditor.voxel);
    const voxels = voxel.present.data.toJS();
    yield call(request.put, `${CONFIG_API_SERVER_URL}/voxel-workspaces/me/${name}`, {
      data: JSON.stringify({ voxels }),
    });
    yield put(pushSnackbar({
      message: `workspace ${name} saved`,
    }));
  },
})
@connect((state: State) => ({
  notImplDialogOpened: state.voxelEditor.ui.notImplDialogOpened,
  workspace: state.voxelEditor.workspace,
}), {
  updateWorkspaceBrowser,
  updateSaveDialog,
  showNotImplDialog,
})
class WorkspacePanel extends React.Component<WorkspacePanelProps, {}> {
  handleOpenButtonClick() {
    this.props.updateWorkspaceBrowser({ open: true });
  }

  handleSaveButtonClick() {
    if (this.props.workspace.name) {
      this.props.runSaga(this.props.save, this.props.workspace.name);
    } else {
      this.props.updateSaveDialog({ open: true });
    }
  }

  handleNewButtonClick() {
    this.props.showNotImplDialog(true);
  }

  handleNotImplDialogCloseRequest() {
    this.props.showNotImplDialog(false);
  }

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

    return connectDragPreview(
      <div style={previewStyle}>
        {connectDragSource(<div style={PanelStyles.handle}>Workspace</div>)}
        <RaisedButton label="Open" secondary={true} onClick={() => this.handleOpenButtonClick()} />
        <RaisedButton label="New" secondary={true} onClick={() => this.handleNewButtonClick()}/>
        <RaisedButton label="Save" secondary={true} onClick={() => this.handleSaveButtonClick()}/>
      </div>
    );
  }
}

export default WorkspacePanel;
