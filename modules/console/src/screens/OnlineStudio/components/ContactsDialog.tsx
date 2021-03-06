import * as React from 'react';
import IconButton from 'material-ui/IconButton';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import Table from 'material-ui/Table/Table';
import TableBody from 'material-ui/Table/TableBody';
import TableHeader from 'material-ui/Table/TableHeader';
import TableHeaderColumn from 'material-ui/Table/TableHeaderColumn';
import TableRow from 'material-ui/Table/TableRow';
import TableRowColumn from 'material-ui/Table/TableRowColumn';

import { GameUser } from '../base';

interface ContectDialogProps extends React.Props<ContactDialog> {
  open: boolean;
  onClose: () => any;
  userid?: string;
  friends: GameUser[];
  onSubmit: (mapId: string) => any;
}

interface ContactDialogState {
  selectedRow?: number;
}

class ContactDialog extends React.Component<ContectDialogProps, ContactDialogState> {
  state = {
    selectedRow: undefined,
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.open === false && nextProps.open === true) {
      // Reset
      this.setState({ selectedRow: undefined });
    }
  };

  handleSubmit() {
    const selected = this.props.friends[this.state.selectedRow];
    if (!selected || !selected.home) {
      console.error('Cannot find home');
      return;
    }
    this.props.onSubmit(selected.home.id);
  }

  getUsersTableElement() {
    if (this.props.friends.length === 0) {
      return null;
    }

    const tableBody = this.props.friends.map((friend, index) => (
      <TableRow key={friend.id} selected={this.state.selectedRow === index}>
        <TableRowColumn>{friend.name}</TableRowColumn>
        <TableRowColumn>{friend.home && friend.home.name}</TableRowColumn>
      </TableRow>
    ));

    return (
      <Table selectable={true} onRowSelection={rows => this.setState({ selectedRow: rows[0] as number })}>
        <TableHeader adjustForCheckbox={false} displaySelectAll={false}>
          <TableRow>
            <TableHeaderColumn tooltip="Friend's name">Name</TableHeaderColumn>
            <TableHeaderColumn tooltip="Friend's home">Home</TableHeaderColumn>
          </TableRow>
        </TableHeader>
        <TableBody displayRowCheckbox={false}>{tableBody}</TableBody>
      </Table>
    );
  }

  render() {
    const table = this.getUsersTableElement();

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
        disabled={this.state.selectedRow === undefined}
        onTouchTap={() => this.handleSubmit()}
      />,
    ];

    return (
      <Dialog
        title="Friends"
        actions={actions}
        modal={false}
        open={this.props.open}
        onRequestClose={this.props.onClose.bind(this)}
      >
        {table}
      </Dialog>
    );
  }
}

export default ContactDialog;

const style = {
  backgroundColor: 'black',
  float: 'right',
};
