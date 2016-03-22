import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { call, put, select } from 'redux-saga/effects';
import RaisedButton from 'material-ui/lib/raised-button';
import * as ReactDnd from 'react-dnd';
const objectAssign = require('object-assign');
import * as axios from 'axios';
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

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

const messages = defineMessages({
  title: {
    id: 'voxel-editor.panels.workspace.title',
    description: 'Voxel editor workspace panel title',
    defaultMessage: 'Workspace',
  },
});

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

@wrapPanel({
  title: messages.title,
})
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
     const { } = this.props;

    return (
      <div>
        <RaisedButton label="Open" secondary={true} onTouchTap={() => this.handleOpenButtonClick()} />
        <RaisedButton label="New" secondary={true} onTouchTap={() => this.handleNewButtonClick()}/>
        <RaisedButton label="Save" secondary={true} onTouchTap={() => this.handleSaveButtonClick()}/>
      </div>
    );
  }
}

export default WorkspacePanel;
