import * as React from 'react';
import Dialog = require('material-ui/lib/dialog');
import * as Promise from 'bluebird';
import * as axios from 'axios';

import Table = require('material-ui/lib/table/table');
import TableBody = require('material-ui/lib/table/table-body');
import TableFooter = require('material-ui/lib/table/table-footer');
import TableHeader = require('material-ui/lib/table/table-header');
import TableHeaderColumn = require('material-ui/lib/table/table-header-column');
import TableRow = require('material-ui/lib/table/table-row');
import TableRowColumn = require('material-ui/lib/table/table-row-column');


import FlatButton = require('material-ui/lib/flat-button');

interface ResponseError extends Error {
  response: any;
}

export interface FileBrowserDialogProps extends React.Props<FileBrowserDialog> {
  open: boolean;
  actions: any;
  onRequestClose: () => void;
}

export class FileBrowserDialog extends React.Component<FileBrowserDialogProps, {
  loading?: boolean;
  error?: any;
  workspaces?: any[];
  selectedRow?: number;
}> {

  constructor(props) {
    super(props);
    this.state = {
      loading: false,
      error: null,
      workspaces: [],
      selectedRow: -1,
    };
  };

  _load(promise) {
    const lockPromise = Promise.try(() => {
      this.setState({ loading: true, workspaces: [], selectedRow: -1, error: null });
    }).disposer(() => {
      this.setState({ loading: false });
    });
    return Promise.using(promise, lockPromise, result => result);
  };

  componentWillReceiveProps(nextProps) {
    if (this.props.open === false && nextProps.open === true) {
      this._load(
        axios.get(`${CONFIG_API_SERVER_URL}/voxel-workspaces/me`, {
          withCredentials: true,
        }).then(res => res.data)
      ).then(response => {
        this.setState({ workspaces: response });
      }).catch(error => {
        this.setState({ error });
      });
    }
  };

  _onDialogSubmit() {
    const workspace = this.state.workspaces[this.state.selectedRow];
    axios.get(`${CONFIG_API_SERVER_URL}/voxel-workspaces/me/${workspace.name}`, {
      withCredentials: true,
    }).then(res => {
      this.props.actions.setWorkspace({
        name: res.data.name,
      });
      const data = JSON.parse(res.data.data);
      this.props.actions.loadWorkspace(data);
      this.props.onRequestClose();
    });
  };

  _onRowSelection(rows) {
    const row = rows[0];
    this.setState({ selectedRow: row });
  };

  render() {
    const actions = [
      <FlatButton
        label="Cancel"
        secondary={true}
        onTouchTap={this.props.onRequestClose} />,
      <FlatButton
        label="Open"
        primary={true}
        onTouchTap={this._onDialogSubmit.bind(this)} />,
    ];

    const workspaces = this.state.workspaces.map((workspace, index) => {
      return <TableRow key={workspace._id} selected={index === this.state.selectedRow}>
        <TableRowColumn>{workspace.name}</TableRowColumn>
        <TableRowColumn>{workspace.createdAt}</TableRowColumn>
      </TableRow>;
    });

    return <Dialog
      open={this.props.open}
      onRequestClose={this.props.onRequestClose}
      title="Open File"
      actions={actions}
      >
      {this.state.error && this.state.error.message}
      <Table style={{display: workspaces.length === 0 ? 'none' : null }} selectable={true} onRowSelection={this._onRowSelection.bind(this)}>
        <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
          <TableRow>
            <TableHeaderColumn tooltip='Workspace Name'>Name</TableHeaderColumn>
            <TableHeaderColumn tooltip='Date when workspace is modified'>modified at</TableHeaderColumn>
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>{workspaces}</TableBody>
      </Table>
    </Dialog>;
  };
};

export default FileBrowserDialog;
