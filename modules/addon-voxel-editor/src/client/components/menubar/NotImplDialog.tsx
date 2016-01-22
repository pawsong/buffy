import * as React from 'react';
import Dialog = require('material-ui/lib/dialog');
import * as MaterialUI from 'material-ui';
import FlatButton = require('material-ui/lib/flat-button');

export interface SaveDialogProps extends React.Props<NotImplDialog> {
  open: boolean;
  onRequestClose: () => void;
}

export class NotImplDialog extends React.Component<SaveDialogProps, {}> {
  render() {
    const actions = [
      <FlatButton
        label="OK"
        secondary={true}
        onTouchTap={this.props.onRequestClose} />,
    ];

    return <Dialog
      open={this.props.open}
      onRequestClose={this.props.onRequestClose}
      title="Sorry!"
      actions={actions}
      >
      Not yet implemented.
    </Dialog>;
  };
};

export default NotImplDialog;
