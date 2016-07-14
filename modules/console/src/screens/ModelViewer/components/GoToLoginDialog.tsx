import React from 'react';
import { Link } from 'react-router';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';

interface GoToLoginDialogProps {
  open: boolean;
  onRequestClose: () => any;
  onRequestLoginPage: () => any;
}

const GoToLoginDialog: React.StatelessComponent<GoToLoginDialogProps> = (props) => {
  const actions = [
    <FlatButton
      label={'Go to login page'}
      primary={true}
      onTouchTap={props.onRequestLoginPage}
    />
  ];

  return (
    <Dialog
      title={'Login to like models'}
      open={props.open}
      actions={actions}
      onRequestClose={props.onRequestClose}
    >
      You need to be logged in to like models.
    </Dialog>
  );
};

export default GoToLoginDialog;
