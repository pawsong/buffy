import * as React from 'react';
import { connect } from 'react-redux';
import Dialog from 'material-ui/lib/dialog';
import FlatButton from 'material-ui/lib/flat-button';

import { State } from '../../../../../../reducers';
import {
  showNotImplDialog,
} from '../../../../../../actions/voxelEditor';

interface NotImplDialogProps extends React.Props<NotImplDialog> {
  open?: boolean;
  showNotImplDialog?: (show: boolean) => any;
}

@connect((state: State) => ({
  open: state.voxelEditor.ui.notImplDialogOpened,
}), {
  showNotImplDialog,
})
export class NotImplDialog extends React.Component<NotImplDialogProps, {}> {
  handleRequestClose() {
    this.props.showNotImplDialog(false);
  }

  render() {
    const actions = [
      <FlatButton
        label="OK"
        secondary={true}
        onTouchTap={() => this.handleRequestClose()} />,
    ];

    return <Dialog
      open={this.props.open}
      onRequestClose={() => this.handleRequestClose()}
      title="Sorry!"
      actions={actions}
      >
      Not yet implemented.
    </Dialog>;
  };
};

export default NotImplDialog;
