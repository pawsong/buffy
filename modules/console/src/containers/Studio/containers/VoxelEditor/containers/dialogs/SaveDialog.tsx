import * as React from 'react';
import { connect } from 'react-redux';

import Dialog = require('material-ui/lib/dialog');
import TextField = require('material-ui/lib/text-field');
import FlatButton = require('material-ui/lib/flat-button');
import * as axios from 'axios';

import { call, put } from 'redux-saga/effects';
import { State } from '../../../../../../reducers';

import {
  saga,
  ImmutableTask,
  SagaProps,
  isRunning,
  request
} from '../../../../../../saga';

import {
  updateSaveDialog, UpdateSaveDialogQuery,
  updateWorkspace,
} from '../../../../../../actions/voxelEditor';

export interface SaveDialogProps extends React.Props<SaveDialog>, SagaProps {
  submit?: ImmutableTask<any>;
  open?: boolean;
  updateSaveDialog?: (query: UpdateSaveDialogQuery) => any;
}

interface SaveDialogState {
  name: string;
}

@saga({
  submit: function* (workspaceName) {
    yield call(request.post, `${CONFIG_API_SERVER_URL}/voxel-workspaces/me/${workspaceName}`, {
      name: workspaceName,
    });
    yield put(updateWorkspace({ name: workspaceName }));
    yield put(updateSaveDialog({ open: false }));
  },
})
@connect((state: State, props) => ({
  open: state.voxelEditor.ui.saveDialog.open,
}), {
  updateSaveDialog,
})
export class SaveDialog extends React.Component<SaveDialogProps, SaveDialogState> {
  constructor(props) {
    super(props);
    this.state = { name: '' };
  };

  handleTextChange(e) {
    this.setState({ name: e.target.value });
  };

  handleSubmit() {
    this.props.runSaga(this.props.submit, this.state.name);
  }

  handleCloseRequest() {
    this.props.updateSaveDialog({ open: false });
  }

  render() {
    const actions = [
      <FlatButton
        label="Cancel"
        secondary={true}
        onTouchTap={() => this.handleCloseRequest()} />,
      <FlatButton
        label="Submit"
        primary={true}
        onTouchTap={() => this.handleSubmit()} />,
    ];
    return <Dialog
      open={this.props.open}
      title="Set name of your workspace"
      actions={actions}
      >
      <TextField hintText="Hint Text" onChange={e => this.handleTextChange(e)}/>
    </Dialog>
  };
};

export default SaveDialog;
