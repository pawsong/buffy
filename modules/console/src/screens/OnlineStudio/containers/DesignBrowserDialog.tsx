import * as React from 'react';
import { connect } from 'react-redux';
import Dialog from 'material-ui/lib/dialog';
import * as Promise from 'bluebird';
import * as axios from 'axios';

import { call, put } from 'redux-saga/effects';

import Table from 'material-ui/lib/table/table';
import TableBody from 'material-ui/lib/table/table-body';
import TableFooter from 'material-ui/lib/table/table-footer';
import TableHeader from 'material-ui/lib/table/table-header';
import TableHeaderColumn from 'material-ui/lib/table/table-header-column';
import TableRow from 'material-ui/lib/table/table-row';
import TableRowColumn from 'material-ui/lib/table/table-row-column';

import FlatButton from 'material-ui/lib/flat-button';

import { State } from '../../../reducers';
import { connectApi, ApiDispatchProps, ApiCall, compareOptions, get } from '../../../api';
import { saga, ImmutableTask, SagaProps, isRunning, request } from '../../../saga';
// import {
//   updateWorkspace,
//   updateWorkspaceBrowser, UpdateWorkspaceBrowserQuery,
// } from '../../../../../../actions/voxelEditor';

const PAGE_SIZE = 10;

interface DesignBrowserDialogProps extends ApiDispatchProps, SagaProps {
  onDesignLoad: (data: any) => any;
  open: boolean;
  onRequestClose: () => any;

  submit?: ImmutableTask<any>;
  workspaces?: ApiCall<any>;
  setWorkspace?: (a: { name: string; data: any }) => any;
  // updateWorkspaceBrowser?: (query: UpdateWorkspaceBrowserQuery) => any;
}

interface DesignBrowserDialogState {
  selectedRow: number;
}

@saga({
  submit: function* (fileId: string, callback) {
    const response = yield call(request.get, `${CONFIG_API_SERVER_URL}/files/${fileId}`);
    if (response.status !== 200) {
      // TODO: Error handling
      console.log('bad :(');
      return;
    }
    callback(response.data);
  },
})
@connectApi((state, props) => ({
  workspaces: get(`${CONFIG_API_SERVER_URL}/files`),
}), (state, props) => ({
}), {
  // updateWorkspaceBrowser,
})
class DesignBrowserDialog extends React.Component<DesignBrowserDialogProps, DesignBrowserDialogState> {
  constructor(props, context) {
    super(props, context);
    this.state = { selectedRow: undefined };
  }

  componentWillUnmount() {
    this.props.cancelSaga(this.props.submit);
  }

  componentWillReceiveProps(nextProps: DesignBrowserDialogProps) {
    // Reload data on page changed
    if (this.props.open && compareOptions(this.props.workspaces, nextProps.workspaces)) {
      this.props.request(this.props.workspaces);
    }

    // Reload data on open
    if (this.props.open === false && nextProps.open === true) {
      this.props.request(this.props.workspaces);
    }
  }

  handlePageChange(page: number) {
    // this.props.updateWorkspaceBrowser({ page });
  }

  handleCloseRequest() {
    if (isRunning(this.props.submit)) return;

    // this.props.updateWorkspaceBrowser({ open: false });
  }

  handleSubmit() {
    if (!this.isSelected()) return;
    if (this.props.workspaces.state !== 'fulfilled') return;
    if (this.props.workspaces.result.length === 0) return;

    const workspace = this.props.workspaces.result[this.state.selectedRow];
    this.props.runSaga(this.props.submit, workspace.id, file => {
      this.props.onDesignLoad(file);
    });
  }

  handleRowSelection(rows) {
    const row = rows[0];
    this.setState({ selectedRow: row });
  };

  renderPending() {
    return <div>Pending</div>;
  }

  renderRejected() {
    return <div>Something went wrong :(</div>;
  }

  renderFulfilled() {
    const tableBody = this.props.workspaces.result.map((workspace, index) => (
      <TableRow key={workspace.id} selected={index === this.state.selectedRow}>
        <TableRowColumn>{workspace.id}</TableRowColumn>
        <TableRowColumn>{workspace.modifiedAt}</TableRowColumn>
      </TableRow>
    ));

    return (
      <Table style={{display: this.props.workspaces.result.length === 0 ? 'none' : null }}
            selectable={true}
            onRowSelection={rows => this.handleRowSelection(rows)}
      >
        <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
          <TableRow>
            <TableHeaderColumn tooltip='Workspace Name'>Name</TableHeaderColumn>
            <TableHeaderColumn tooltip='Date when workspace is modified'>modified at</TableHeaderColumn>
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>
          {tableBody}
        </TableBody>
      </Table>
    );
  }

  isSelected() {
    return this.state.selectedRow !== undefined;
  }

  render() {
    let body = null;
    switch(this.props.workspaces.state) {
      case 'fulfilled': {
        body = this.renderFulfilled();
        break;
      }
      case 'rejected': {
        body = this.renderRejected();
        break;
      }
      case 'pending': {
        body = this.renderPending();
        break;
      }
    }

    const actions = [
      <FlatButton
        label="Cancel"
        secondary={true}
        onTouchTap={this.props.onRequestClose}
        disabled={this.props.submit.state === 'running'}
      />,
      <FlatButton
        label="Open"
        primary={true}
        onTouchTap={() => this.handleSubmit()}
        disabled={!this.isSelected()  || this.props.submit.state === 'running'}
      />,
    ];

    return (
      <Dialog
        open={this.props.open}
        onRequestClose={this.props.onRequestClose}
        title="Open Design File"
        actions={actions}
      >
        {body}
      </Dialog>
    );
  }
}

export default DesignBrowserDialog;
