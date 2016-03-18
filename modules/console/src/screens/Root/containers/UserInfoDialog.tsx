import * as React from 'react';
import Dialog from 'material-ui/lib/dialog';
import FlatButton from 'material-ui/lib/flat-button';
import TextField from 'material-ui/lib/text-field';
import { connect } from 'react-redux';
import { State } from '../../../reducers';
import { saga, SagaProps, ImmutableTask, isRunning, request } from '../../../saga';
import { call, put } from 'redux-saga/effects';
import { usernameUpdate } from '../../../actions/auth';

interface UserInfoDialogProps extends React.Props<UserInfoDialog>, SagaProps {
  userid?: string;
  username?: string;
  submit?: ImmutableTask<any>;
}

interface UserInfoDialogStates {
  username?: string;
  pending?: boolean;
}

@saga({
  submit: function* (username) {
    yield call(request.put, `${CONFIG_AUTH_SERVER_URL}/me`, {
      name: username,
    });
    yield put(usernameUpdate(username));
  },
})
@connect((state: State) => ({
  userid: state.auth.userid,
  username: state.auth.username,
}))
class UserInfoDialog extends React.Component<UserInfoDialogProps, UserInfoDialogStates> {
  state = {
    username: '',
  }

  shouldUpdateInfo() {
    return !!this.props.userid && !this.props.username;
  }

  submit() {
    if (isRunning(this.props.submit)) return;
    this.props.runSaga(this.props.submit, this.state.username);
  }

  render() {
    const isSubmitPending = isRunning(this.props.submit);

    const actions = [
      <FlatButton label="Submit"
                  primary={true}
                  disabled={isSubmitPending}
                  onTouchTap={() => this.submit()}
      />,
    ];

    const open = this.shouldUpdateInfo();

    return (
      <Dialog title="User information"
                   open={open}
                   modal={true}
                   actions={actions}
      >
        <div>Name</div>
        <TextField onEnterKeyDown={() => this.submit()}
                   disabled={isSubmitPending}
                   onChange={(e) => this.setState({ username: e.target['value'] })}
                   hintText="Dora Fisher"
        />
        <br />
      </Dialog>
    );
  };
};

export default UserInfoDialog;
