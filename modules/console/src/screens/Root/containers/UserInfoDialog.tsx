import * as React from 'react';
import { connect } from 'react-redux';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
import CircularProgress from 'material-ui/CircularProgress';
import * as Colors from 'material-ui/styles/colors';
import FontIcon from 'material-ui/FontIcon';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';
import { State } from '../../../reducers';
import { saga, SagaProps, ImmutableTask, isRunning, isDone, request, wait } from '../../../saga';
import { call, put } from 'redux-saga/effects';
import { userUpdate } from '../../../actions/users';
import { User } from '../../../reducers/users';
import validateUsername, {
  ValidationResult as UsernameValidationResult,
  MIN_LENGTH as MIN_USERNAME_LENGTH,
  MAX_LENGTH as MAX_USERNAME_LENGTH,
} from '@pasta/helper/lib/validateUsername';

const messages = defineMessages({
  modalTitle: {
    id: 'signup.modal.title',
    description: 'signup modal title',
    defaultMessage: 'Thank you for signing up!',
  },
  modelNote: {
    id: 'signup.modal.note',
    description: 'signup modal note',
    defaultMessage: 'You can change your username in your account settings at any time.',
  },
  createUsername: {
    id: 'signup.modal.create.username',
    description: 'signup model sub description',
    defaultMessage: 'Create your username',
  },
  usernameTooShort: {
    id: 'username.too.short',
    description: 'Error message for too short username',
    defaultMessage: 'Your username must be at least {minimum} characters.',
  },
  usernameTooLong: {
    id: 'username.too.long',
    description: 'Error message for too short username',
    defaultMessage: 'Your username must be at most {maximum} characters.',
  },
  usernameInvalidCharacter: {
    id: 'username.invalid.character',
    description: 'Error message for username that contains invalid characters',
    defaultMessage: 'Usernames must only contain lowercase letters, numbers, ' +
                    'dashes and must start with a letter or number.',
  },
  usernameUnknownError: {
    id: 'username.unknown.error',
    description: 'Error message for invalid username for unknown reason',
    defaultMessage: 'Your username is invalid.',
  },
  usernameAlreadyExists: {
    id: 'username.already.exists',
    description: 'Error message for username that has already been taken by others',
    defaultMessage: 'This username is already in use.',
  },
});

function getUsernameErrorMessage(formatMessage: any, validationResult: UsernameValidationResult) {
  switch(validationResult) {
    case UsernameValidationResult.TOO_SHORT: {
      return formatMessage(messages.usernameTooShort, {
        minimum: MIN_USERNAME_LENGTH,
      });
    }
    case UsernameValidationResult.TOO_LONG: {
      return formatMessage(messages.usernameTooLong, {
        maximum: MAX_USERNAME_LENGTH,
      });
    }
    case UsernameValidationResult.INVALID_CHARACTER: {
      return formatMessage(messages.usernameInvalidCharacter);
    }
  }
  return formatMessage(messages.usernameUnknownError);
}

interface ValidationResult {
  valid: boolean;
  error: string;
}

interface UserInfoDialogProps extends React.Props<UserInfoDialog>, SagaProps {
  user?: User;
  validateUsername?: ImmutableTask<ValidationResult>;
  submit?: ImmutableTask<any>;
  intl?: InjectedIntlProps;
}

interface UserInfoDialogStates {
  username?: string;
}

const styles = {
  note: {
    fontSize: 14,
    marginTop: 20,
  },
  textfieldCheck: {
    position: 'absolute',
    color: Colors.cyan500,
    fontSize: 20,
    top: 39,
    right: 3,
  },
  progress: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -38,
    marginTop: 23,
  },
  inputRow: {
    position: 'relative',
    marginBottom: 10,
  },
  modelContent: {
    width: 500,
    maxWidth: 'none',
  },
};

@saga({
  validateUsername: function* (formatMessage, username) {
    // Wait for 1 sec to prevent unnecessary validation
    yield call(wait, 1000);

    const usernameValidationResult = validateUsername(username);

    if (usernameValidationResult !== UsernameValidationResult.OK) {
      const error = getUsernameErrorMessage(formatMessage, usernameValidationResult);
      return { valid: false, error };
    }

    const response = yield call(request.get, `${CONFIG_API_SERVER_URL}/username-exists/${username}`);
    const exists = response.data.result;
    return exists ? {
      valid: false,
      error: formatMessage(messages.usernameAlreadyExists),
    } : {
      valid: true,
      error: '',
    };
  },
  submit: function* (userId, username) {
    const response = yield call(request.put, `${CONFIG_API_SERVER_URL}/me`, {
      username,
    });
    console.log(response);
    if (response.status !== 200) {
      // TODO: Error handling
      return;
    }
    yield put(userUpdate(userId, { username }));
  },
})
@(connect((state: State) => ({
  user: state.users.get(state.auth.userid),
})) as any)
@injectIntl
class UserInfoDialog extends React.Component<UserInfoDialogProps, UserInfoDialogStates> {
  constructor(props) {
    super(props);

    // TODO: Suggest username from email or other materials.
    this.state = { username: '' };
  }

  shouldUpdateInfo() {
    if (!this.props.user) return false;

    return !this.props.user.username;
  }

  submit() {
    if (isRunning(this.props.submit)) return;
    this.props.runSaga(this.props.submit, this.props.user.id, this.state.username);
  }

  handleUsernameChange(e: React.FormEvent) {
    const username = e.target['value'];
    this.setState({ username });

    this.props.runSaga(this.props.validateUsername, this.props.intl.formatMessage, username);
  }

  render() {
    if (!this.shouldUpdateInfo()) return null;

    const usernameIsValid = isDone(this.props.validateUsername) && this.props.validateUsername.result.valid;
    const usernameErrorMessage = isDone(this.props.validateUsername) ? this.props.validateUsername.result.error : '';

    const formIsValid = usernameIsValid;

    const isSubmitPending = isRunning(this.props.submit);

    const actions = [
      <FlatButton label={this.props.intl.formatMessage(Messages.submit)}
                  primary={true}
                  disabled={!formIsValid || isSubmitPending}
                  onTouchTap={() => this.submit()}
      />,
    ];

    return (
      <Dialog title={this.props.intl.formatMessage(messages.modalTitle)}
              open={true}
              modal={true}
              actions={actions}
              contentStyle={styles.modelContent}
      >
        <div>{this.props.intl.formatMessage(messages.createUsername)}</div>
        <div style={styles.inputRow}>
          <TextField onEnterKeyDown={() => this.submit()}
                    disabled={isSubmitPending}
                    onChange={e => this.handleUsernameChange(e)}
                    floatingLabelText={this.props.intl.formatMessage(Messages.username)}
                    fullWidth={true}
                    errorText={usernameErrorMessage}
          />
          {isRunning(this.props.validateUsername) ? <CircularProgress size={0.3} style={styles.progress} /> : null}
          <FontIcon className="material-icons" style={Object.assign({}, styles.textfieldCheck, {
            display: usernameIsValid ? 'inline-block' : 'none',
          })}>check</FontIcon>
        </div>
        <div style={styles.note}>
          {this.props.intl.formatMessage(messages.modelNote)}
        </div>
      </Dialog>
    );
  };
};

export default UserInfoDialog;
