import React from 'react';
import Dialog from 'material-ui/lib/dialog';

const NotImplDialog = React.createClass({
  render() {
    const {
      ...other,
    } = this.props;

    const actions = [
      { text: 'OK' },
    ];

    return <Dialog
      {...other}
      title="Sorry!"
      actions={actions}
      >
      Not yet implemented.
    </Dialog>;
  },
});

export default NotImplDialog;
