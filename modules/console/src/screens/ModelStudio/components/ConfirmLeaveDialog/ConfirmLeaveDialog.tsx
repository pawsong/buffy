import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';

interface ConfirmLeaveDialogProps {
  open: boolean;
  onRequestClose: () => any;
  onLeaveConfirm: () => any;
}

class ConfirmLeaveDialog extends React.Component<ConfirmLeaveDialogProps, {}> {
  render() {
    const actions = [
      <FlatButton
        label="No"
        primary={true}
        onTouchTap={this.props.onRequestClose}
      />,
      <FlatButton
        label="Yes"
        secondary={true}
        keyboardFocused={true}
        onTouchTap={this.props.onLeaveConfirm}
      />,
    ];

    return (
      <Dialog
        title="Unsaved changes"
        actions={actions}
        open={this.props.open}
        onRequestClose={this.props.onRequestClose}
      >
        You have unsaved changes. Do you want to leave this page and lose your changes?
      </Dialog>
    );
  }
}

export default ConfirmLeaveDialog;
