import * as React from 'react';
import { connect } from 'react-redux';
import { call, put } from 'redux-saga/effects';

import TextField from 'material-ui/TextField';
import FlatButton from 'material-ui/FlatButton';
import {Card, CardActions, CardHeader, CardMedia, CardTitle, CardText} from 'material-ui/Card';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../../../../constants/Messages';

import { State } from '../../../../../../reducers';
import { pushSnackbar } from '../../../../../../actions/snackbar';

import validatePassword, {
  MIN_LENGTH as PASSWORD_MIN_LENGTH,
  MAX_LENGTH as PASSWORD_MAX_LENGTH,
  ValidationResult as PasswordValidationResult,
} from '@pasta/helper/lib/validatePassword';

import { saga, SagaProps, ImmutableTask, isRunning, isDone, request, wait } from '../../../../../../saga';

function validateVerifyPassword(verifyPassword: string, newPassword: string) {
  let result: VerifyPasswordValidationResult;

  if (!verifyPassword) {
    result = VerifyPasswordValidationResult.EMPTY;
  } else if (verifyPassword !== newPassword) {
    result = VerifyPasswordValidationResult.NOT_EQUAL;
  } else {
    result = VerifyPasswordValidationResult.OK;
  }

  return result;
}

enum VerifyPasswordValidationResult {
  EMPTY,
  NOT_EQUAL,
  OK,
}

interface PasswordFormProps extends SagaProps {
  intl?: InjectedIntlProps;
  changePassword?: ImmutableTask<any>;
  pushSnackbar?: typeof pushSnackbar;
}

interface PasswordFormState {
  currentPassword?: string;
  newPassword?: string;
  newPasswordValidation?: PasswordValidationResult;
  verifyPassword?: string;
  verifyPasswordValidation?: VerifyPasswordValidationResult;
}

enum UpdatePasswordResult {
  OK,
  INVALID_PASSWORD,
  UNKNOWN,
}

@(connect(null, {
  pushSnackbar,
}) as any)
@saga({
  changePassword: function* (password: string, newPassword: string, done: (result: UpdatePasswordResult) => any) {
    const response = yield call(request.post, `${CONFIG_API_SERVER_URL}/password/update`, {
      password, newPassword,
    });

    if (response.status === 403 && response.data === 'invalid_password') {
      return done(UpdatePasswordResult.INVALID_PASSWORD);
    } else if (response.status !== 200) {
      return done(UpdatePasswordResult.UNKNOWN);
    }

    return done(UpdatePasswordResult.OK);
  },
})
@injectIntl
class PasswordForm extends React.Component<PasswordFormProps, PasswordFormState> {
  constructor(props) {
    super(props);
    this.state = {
      currentPassword: '',
      newPassword: '',
      newPasswordValidation: PasswordValidationResult.EMPTY,
      verifyPassword: '',
      verifyPasswordValidation: VerifyPasswordValidationResult.EMPTY,
    };
  }

  handleCurrentPasswordChange = (e: React.FormEvent) => {
    this.setState({ currentPassword: e.target['value'] });
  }

  handleNewPasswordChange = (e: React.FormEvent) => {
    const newPassword = e.target['value'];

    this.setState({
      newPassword,
      newPasswordValidation: validatePassword(newPassword),
      verifyPasswordValidation: validateVerifyPassword(this.state.verifyPassword, newPassword),
    });
  }

  handleVerifyPasswordChange = (e: React.FormEvent) => {
    const verifyPassword = e.target['value'];

    this.setState({
      verifyPassword,
      verifyPasswordValidation: validateVerifyPassword(verifyPassword, this.state.newPassword),
    });
  }

  isReadyToChangePassword() {
    return (
         !!this.state.currentPassword
      && this.state.newPasswordValidation === PasswordValidationResult.OK
      && this.state.verifyPasswordValidation === VerifyPasswordValidationResult.OK
    );
  }

  getNewPasswordErrorText() {
    switch(this.state.newPasswordValidation) {
      case PasswordValidationResult.TOO_SHORT: {
        return this.props.intl.formatMessage(Messages.passwordTooShort, { minimum: PASSWORD_MIN_LENGTH });
      }
      case PasswordValidationResult.TOO_LONG: {
        return this.props.intl.formatMessage(Messages.passwordTooLong, { maximum: PASSWORD_MAX_LENGTH });
      }
      case PasswordValidationResult.OK:
      case PasswordValidationResult.EMPTY:
      {
        return '';
      }
    }
  }

  getVerifyPasswordErrorText() {
    switch(this.state.verifyPasswordValidation) {
      case VerifyPasswordValidationResult.NOT_EQUAL: {
        return this.props.intl.formatMessage(Messages.passwordVerifyNotEqual);
      }
      case VerifyPasswordValidationResult.OK:
      case VerifyPasswordValidationResult.EMPTY:
      {
        return '';
      }
    }
  }

  submitPasswordChangeRequest = () => {
    this.props.runSaga(this.props.changePassword,
      this.state.currentPassword, this.state.newPassword,
      (result: UpdatePasswordResult) => {
        switch(result) {
          case UpdatePasswordResult.INVALID_PASSWORD: {
            this.props.pushSnackbar({ message: 'Incorrect current password' });
            return;
          }
          case UpdatePasswordResult.UNKNOWN: {
            this.props.pushSnackbar({ message: 'Password change failed' });
            return;
          }
        }

        this.props.pushSnackbar({ message: 'Password successfully changed' });
        this.setState({
          currentPassword: '',
          newPassword: '',
          newPasswordValidation: PasswordValidationResult.EMPTY,
          verifyPassword: '',
          verifyPasswordValidation: VerifyPasswordValidationResult.EMPTY,
        });
      }
    );
  }

  render() {
    return (
      <Card>
        <CardTitle title="Password" />
        <CardText>
          <div>
            <TextField
              floatingLabelText="Current password"
              type="password"
              value={this.state.currentPassword}
              onChange={this.handleCurrentPasswordChange}
              disabled={isRunning(this.props.changePassword)}
            />
          </div>
          <div>
            <TextField
              floatingLabelText="New password"
              type="password"
              value={this.state.newPassword}
              onChange={this.handleNewPasswordChange}
              disabled={isRunning(this.props.changePassword)}
              errorText={this.getNewPasswordErrorText()}
            />
          </div>
          <div>
            <TextField
              floatingLabelText="Verify password"
              type="password"
              value={this.state.verifyPassword}
              onChange={this.handleVerifyPasswordChange}
              disabled={isRunning(this.props.changePassword)}
              errorText={this.getVerifyPasswordErrorText()}
            />
          </div>
        </CardText>
        <CardActions>
          <FlatButton
            primary={true}
            label="Change password"
            onTouchTap={this.submitPasswordChangeRequest}
            disabled={
              isRunning(this.props.changePassword) || !this.isReadyToChangePassword()
            }
          />
        </CardActions>
      </Card>
    );
  }
}

export default PasswordForm;
