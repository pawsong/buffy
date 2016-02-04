import * as React from 'react';
import Dialog = require('material-ui/lib/dialog');
import * as MaterialUI from 'material-ui';
import FlatButton = require('material-ui/lib/flat-button');
import TextField = require('material-ui/lib/text-field');
import { connect } from 'react-redux';
import * as axios from 'axios';

import * as ActionTypes from '../../constants/ActionTypes';

interface UserInfoDialogProps extends React.Props<UserInfoDialog> {
  user?: { name };
  updateUserInfo?: Function;
}

interface UserInfoDialogStates {
  username?: string;
  pending?: boolean;
}

class UserInfoDialog extends React.Component<UserInfoDialogProps, UserInfoDialogStates> {
  state = {
    username: '',
    pending: false,
  }

  shouldUpdateInfo = (user) => {
    return !this.props.user.name;
  }

  submit() {
    if (!this.state.username) { return; }
    this.setState({ pending: true });

    axios.post(`${CONFIG_AUTH_SERVER_URL}/me`, {
      name: this.state.username,
    }, {
      withCredentials: true,
    }).then(() => {
      this.props.updateUserInfo({ name: this.state.username });
    }).catch(err => {
      // TODO: Show error
      console.error(err);
    });
  }

  render() {
    return <Dialog
      title="User information"
      open={this.shouldUpdateInfo(this.props.user)}
      modal={true}
      actions={[
      <FlatButton
        label="Submit"
        primary={true}
        disabled={this.state.pending}
        onTouchTap={this.submit.bind(this)} />,
      ]}>
      <div>Name</div>
      <TextField
      onEnterKeyDown={this.submit.bind(this)}
      disabled={this.state.pending}
      onChange={(e) => this.setState({ username: e.target['value'] })}
      hintText="Dora	Fisher"/><br/>
    </Dialog>;
  };
};

export default connect(
  state => ({
    user: state.auth.user
  }),
  dispatch => ({
    updateUserInfo: update => dispatch({
      type: ActionTypes.UPDATE_USER_INFO, update,
    }),
  })
)(UserInfoDialog);
