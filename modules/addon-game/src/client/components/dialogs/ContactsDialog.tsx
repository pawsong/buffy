import * as React from 'react';
import IconButton = require('material-ui/lib/icon-button');
import Dialog = require('material-ui/lib/dialog');
import FlatButton = require('material-ui/lib/flat-button');
import RaisedButton = require('material-ui/lib/raised-button');
import Table = require('material-ui/lib/table/table');
import TableBody = require('material-ui/lib/table/table-body');
import TableFooter = require('material-ui/lib/table/table-footer');
import TableHeader = require('material-ui/lib/table/table-header');
import TableHeaderColumn = require('material-ui/lib/table/table-header-column');
import TableRow = require('material-ui/lib/table/table-row');
import TableRowColumn = require('material-ui/lib/table/table-row-column');
const { connect, PromiseState } = require('react-refetch');
import connectStateLayer from '@pasta/components/lib/stateLayer/connect';
import StateLayer from '@pasta/core/lib/StateLayer';

const style = {
  backgroundColor: 'black',
  float: 'right',
};

interface ContectDialogProps extends React.Props<ContactDialog> {
  open: boolean;
  onClose: Function;
  friendsFetch?: any;
  refreshFriends?: any;
  stateLayer?: StateLayer;
}

interface ContactDialogState {
  selectedRow?: number;
}

@connectStateLayer()
class ContactDialog extends React.Component<ContectDialogProps, ContactDialogState> {
  // TypeScript jsx parser omits adding displayName when using decorator
  static displayName = 'ContactDialog';

  state = {
    selectedRow: -1,
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.open === false && nextProps.open === true) {
      // Reset
      this.setState({ selectedRow: -1 });
      this.props.refreshFriends();
    }
  };

  onSelectRow(rows) {
    const row = rows[0];
    this.setState({ selectedRow: row });
  };

  async onSubmit() {
    const selected = this.props.friendsFetch.value[this.state.selectedRow];
    if (!selected.home) {
      console.error('Cannot find home')
      return;
    }
    await this.props.stateLayer.rpc.moveMap({ id: selected.home._id });
    this.props.onClose();
  }

  render() {
    const body = ((fetch) => {
      if (fetch.pending) {
        return <div>Pending</div>;
      } else if (fetch.rejected) {
        return <div>Rejected</div>;
      } else if (fetch.fulfilled) {
        const friends = fetch.value;
        if (friends.length === 0) { return null; }

        const tableBody = friends.map((friend, index) => {
          return <TableRow key={friend._id} selected={index === this.state.selectedRow}>
            <TableRowColumn>{friend.name}</TableRowColumn>
            <TableRowColumn>{friend.home && friend.home.name}</TableRowColumn>
          </TableRow>;
        });

        return <Table selectable={true} onRowSelection={this.onSelectRow.bind(this)}>
          <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
            <TableRow>
              <TableHeaderColumn tooltip="Friend's name">Name</TableHeaderColumn>
              <TableHeaderColumn tooltip="Friend's home">Home</TableHeaderColumn>
            </TableRow>
          </TableHeader>
          <TableBody displayRowCheckbox={false}>{tableBody}</TableBody>
        </Table>
      }

      return null;
    })(this.props.friendsFetch || {});

    const actions = [
      <FlatButton
        label="Cancel"
        secondary={true}
        onTouchTap={this.props.onClose.bind(this)}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        keyboardFocused={true}
        disabled={this.state.selectedRow === -1}
        onTouchTap={this.onSubmit.bind(this)}
      />,
    ];

    return <Dialog
      title="Friends"
      actions={actions}
      modal={false}
      open={this.props.open}
      onRequestClose={this.props.onClose.bind(this)}
    >{body}</Dialog>;
  }
}

export default connect(props => ({
  refreshFriends: () => ({
    friendsFetch: {
      url: `${CONFIG_GAME_SERVER_URL}/friends`,
      credentials: 'include',
      force: true,
      refreshing: true,
    },
  })
}))(ContactDialog);
