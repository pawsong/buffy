import * as React from 'react';
import Dialog = require('material-ui/lib/dialog');
import * as MaterialUI from 'material-ui';

export interface SaveDialogProps extends React.Props<NotImplDialog> {
  open: boolean;
  onRequestClose: (buttonClicked: boolean) => void;
}

export class NotImplDialog extends React.Component<SaveDialogProps, {}> {
  render() {
    const actions = [
      { text: 'OK' },
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
