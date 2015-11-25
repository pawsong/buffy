import React from 'react';
import Dialog from 'material-ui/lib/dialog';
import Promise from 'bluebird';

import config from '@pasta/config-public';

const Table = require('material-ui/lib/table/table');
const TableBody = require('material-ui/lib/table/table-body');
const TableFooter = require('material-ui/lib/table/table-footer');
const TableHeader = require('material-ui/lib/table/table-header');
const TableHeaderColumn = require('material-ui/lib/table/table-header-column');
const TableRow = require('material-ui/lib/table/table-row');
const TableRowColumn = require('material-ui/lib/table/table-row-column');

const FileBrowserDialog = React.createClass({
  getInitialState() {
    return {
      loading: false,
      error: null,
      workspaces: [],
      selectedRow: -1,
    };
  },

  _load(promise) {
    const lockPromise = Promise.try(() => {
      this.setState({ loading: true, workspaces: [], selectedRow: -1, error: null });
    }).disposer(() => {
      this.setState({ loading: false });
    });
    return Promise.using(promise, lockPromise, result => result);
  },

  componentWillReceiveProps(nextProps) {
    if (this.props.open === false && nextProps.open === true) {
      function checkStatus(response) {
        if (response.status >= 200 && response.status < 300) {
          return response
        } else {
          var error = new Error(response.statusText)
          error.response = response
          throw error
        }
      }

      function parseJSON(response) {
        return response.json()
      }

      this._load(
        fetch(`${config.apiServerUrl}/voxel-workspaces/me`, {
          credentials: 'include',
        }).then(checkStatus).then(parseJSON)
      ).then(response => {
        this.setState({ workspaces: response });
      }).catch(error => {
        this.setState({ error });
      });
    }
  },

  _onDialogSubmit() {
    const workspace = this.state.workspaces[this.state.selectedRow];
    fetch(`${config.apiServerUrl}/voxel-workspaces/me/${workspace.name}`, {
      credentials: 'include',
    }).then(response => {
      return response.json();
    }).then(response => {
      this.props.actions.setWorkspace({
        name: response.name,
      });
      const data = JSON.parse(response.data);
      this.props.actions.loadWorkspace(data);
      this.props.onRequestClose();
    });
  },

  _onRowSelection(rows) {
    const row = rows[0];
    this.setState({ selectedRow: row });
  },

  render() {
    const {
      ...other,
    } = this.props;

    const actions = [
      { text: 'Cancel' },
      { text: 'Open', onTouchTap: this._onDialogSubmit, ref: 'open' },
    ];

    const workspaces = this.state.workspaces.map((workspace, index) => {
      return <TableRow key={workspace._id} selected={index === this.state.selectedRow}>
        <TableRowColumn>{workspace.name}</TableRowColumn>
        <TableRowColumn>{workspace.createdAt}</TableRowColumn>
      </TableRow>;
    });

    return <Dialog
      {...other}
      title="Open File"
      actions={actions}
      actionFocus="open"
      >
      {this.state.error && this.state.error.message}
      <Table style={{display: workspaces.length === 0 ? 'none' : null }} selectable={true} onRowSelection={this._onRowSelection}>
        <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
          <TableRow>
            <TableHeaderColumn tooltip='Workspace Name'>Name</TableHeaderColumn>
            <TableHeaderColumn tooltip='Date when workspace is modified'>modified at</TableHeaderColumn>
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>{workspaces}</TableBody>
      </Table>
    </Dialog>;
  },
});

export default FileBrowserDialog;
