import * as React from 'react';
import { Link } from 'react-router';
import * as Colors from 'material-ui/styles/colors';
import TextField from 'material-ui/TextField';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import { call, put, cancelled } from 'redux-saga/effects';
import { replace } from 'react-router-redux';
const isEmail = require('validator/lib/isEmail');
import CircularProgress from 'material-ui/CircularProgress';
import BuffyIcon from '../../../components/BuffyIcon';
import { TouchTapEvent } from 'material-ui';
import { saga, SagaProps, ImmutableTask, request, wait, isRunning, isDone } from '../../../saga';
import Messages from '../../../constants/Messages';
import FullscreenForm from '../../../components/FullscreenForm';

import { localLogin, facebookLogin } from '../../Login/sagas';

import validatePassword, {
  MIN_LENGTH as PASSWORD_MIN_LENGTH,
  MAX_LENGTH as PASSWORD_MAX_LENGTH,
  ValidationResult as PasswordValidationResult,
} from '@pasta/helper/lib/validatePassword';

const styles = {
  facebookLoginButton: {
    width: '100%',
    marginTop: 17,
  },
  progressOverlay: {
    position: 'absolute',
    margin: 0,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1,
  },
  inputRow: {
    position: 'relative',
    marginBottom: 10,
  },
  textfield: {
    width: '100%',
    textAlign: 'left',
  },
  input: {
    width: 'calc(100% - 30px)',
  },
  loginButton: {
    width: '100%',
    marginTop: 20,
  },
  loginContainer: {
    marginTop: 20,
    textAlign: 'center',
  },
  loginMessage: {
    color: Colors.lightBlack,
  },
  loginLink: {
    display: 'inline-block',
    color: Colors.cyan500,
  },
  textfieldError: {
    position: 'absolute',
    bottom: -10,
  },
  textfieldCheck: {
    position: 'absolute',
    color: Colors.cyan500,
    fontSize: 20,
    top: 12,
    right: 6,
  },
  progress: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -41,
    marginTop: -3,
  },
  divider: {
    marginTop: 20,
    marginBottom: 20,
  },
  errorMessage: {
    marginBottom: 20,
  },
  errorIcon: {
    top: 6, right: 3,
  },
};

const messages = defineMessages({
  heading: {
    id: 'join.form.heading',
    description: 'Join form heading message',
    defaultMessage: 'Join {service}',
  },
  haveAccount: {
    id: 'join.form.haveAccount',
    description: 'Ask if user has an account',
    defaultMessage: 'Have account?',
  },
  invalidEmail: {
    id: 'invalidEmail',
    description: 'Warning message for invalid email',
    defaultMessage: 'Please enter a valid email',
  },
  emailAlreadyExists: {
    id: 'emailAlreadyExists',
    description: 'Warning message for already registered email',
    defaultMessage: 'This email is already registered',
  },
  nameRequired: {
    id: 'nameRequired',
    description: 'Warning message for empty name field',
    defaultMessage: 'Please enter your name',
  },
  emailRequired: {
    id: 'emailRequired',
    description: 'Warning message for empty email field',
    defaultMessage: 'Please enter your email',
  },
  passwordRequired: {
    id: 'passwordRequired',
    description: 'Warning message for empty password field',
    defaultMessage: 'Please enter your password',
  },
  localSignUpFailed: {
    id: 'localSignUpFailed',
    description: 'Error message to show when signup with email & password fails',
    defaultMessage: 'Sign up failed',
  },
});

interface ValidateResult {
  valid: boolean;
  error: string;
}

interface JoinFormProps extends React.Props<JoinForm>, SagaProps {
  intl?: InjectedIntlProps;
  validateEmail?: ImmutableTask<ValidateResult>;
  localSignUp?: ImmutableTask<LoginResult>;
  facebookSignUp?: ImmutableTask<LoginResult>;
}

interface JoinFormState {
  email?: string;
  password?: string;
  haveSubmitted?: boolean;
}

interface LoginResult {
  result: boolean;
  descriptor: any;
}

@injectIntl
@saga({
  validateEmail: function* (email, formatMessage) {
    // Wait for 1 sec to prevent unnecessary validation
    yield call(wait, 1000);

    if (!isEmail(email)) {
      return {
        valid: false,
        error: formatMessage(messages.invalidEmail),
      };
    }

    const response = yield call(request.get, `${CONFIG_API_SERVER_URL}/signup/local/exists/${email}`);
    const exists = response.data.result;
    return exists ? {
      valid: false,
      error: formatMessage(messages.emailAlreadyExists),
    } : {
      valid: true,
      error: '',
    };
  },
  localSignUp: function* (email, password) {
    const response = yield call(request.post, `${CONFIG_API_SERVER_URL}/signup/local`, {
      email,
      password,
    });
    if (response.status !== 200) {
      return { result: false, descriptor: messages.localSignUpFailed };
    }

    const result = yield call(localLogin, email, password);
    if (result) {
      yield put(replace('/'));
    }
    return { result, descriptor: Messages.localLoginFailed };
  },
  facebookSignUp: function* () {
    const result = yield call(facebookLogin);
    if (result) {
      yield put(replace('/'));
    }
    return { result, descriptor: Messages.facebookLoginFailed };
  },
})
class JoinForm extends React.Component<JoinFormProps, JoinFormState> {
  defaultValidation: ValidateResult;

  constructor(props, context) {
    super(props, context);
    this.state = {
      email: '',
      password: '',
      haveSubmitted: false,
    };

    this.defaultValidation = { valid: false, error: '' };
  }

  cancelSignUpRequests() {
    this.props.cancelSaga(this.props.localSignUp);
    this.props.cancelSaga(this.props.facebookSignUp);
  }

  componentWillUnmount() {
    this.props.cancelSaga(this.props.validateEmail);
    this.cancelSignUpRequests();
  }

  handleEmailChange(e) {
    const email = e.target.value;
    this.setState({ email });
    if (!email) {
      this.props.cancelSaga(this.props.validateEmail);
      return;
    }
    this.props.runSaga(this.props.validateEmail, email, this.props.intl.formatMessage);
  }

  handlePasswordChange(e) {
    this.setState({ password: e.target.value });
  }

  handleLocalSignUpSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!this.state.haveSubmitted) this.setState({ haveSubmitted: true });

    if (!this.validateForm()) return;

    this.cancelSignUpRequests();
    this.props.runSaga(this.props.localSignUp, this.state.email, this.state.password);
  }

  handleFacebookSignUpSubmit() {
    this.cancelSignUpRequests();
    this.props.runSaga(this.props.facebookSignUp);
  }

  validateForm() {
    return [
      isDone(this.props.validateEmail) ? this.props.validateEmail.result.valid : false,
      this.validatePassword().valid,
    ].reduce((prev, cur) => prev && cur);
  }

  validatePassword(): ValidateResult {
    if (!this.state.password) {
      return {
        valid: false,
        error: this.props.intl.formatMessage(messages.passwordRequired),
      };
    }

    const result = validatePassword(this.state.password);

    if (result !== PasswordValidationResult.OK) {
      switch(result) {
        case PasswordValidationResult.TOO_SHORT: {
          return {
            valid: false,
            error: this.props.intl.formatMessage(Messages.passwordTooShort, { minimum: PASSWORD_MIN_LENGTH }),
          };
        }
        case PasswordValidationResult.TOO_LONG: {
          return {
            valid: false,
            error: this.props.intl.formatMessage(Messages.passwordTooLong, { maximum: PASSWORD_MAX_LENGTH }),
          };
        }
      }

      return {
        valid: false,
        error: this.props.intl.formatMessage(Messages.passwordUnknownError),
      };
    }

    return { valid: true, error: '' };
  }

  isFormBusy() {
    return isRunning(this.props.localSignUp) || isRunning(this.props.facebookSignUp);
  }

  render() {
    let emailValidation = this.defaultValidation;
    if (this.state.haveSubmitted || this.state.email) {
      if (!this.state.email) {
        emailValidation = {
          valid: false,
          error: this.props.intl.formatMessage(messages.emailRequired),
        };
      } else if (isDone(this.props.validateEmail)) {
        emailValidation = this.props.validateEmail.result;
      }
    }

    let passwordValidation = this.defaultValidation;
    if (this.state.haveSubmitted || this.state.password) {
      passwordValidation = this.validatePassword();
    }

    const localLoginSubmitDisabled = this.state.haveSubmitted && ![
      emailValidation.valid,
      passwordValidation.valid,
    ].reduce((prev, cur) => prev && cur);

    const formIsBusy = this.isFormBusy();

    let errorMessage = '';
    if (isDone(this.props.localSignUp) && this.props.localSignUp.result.result === false) {
      errorMessage = this.props.intl.formatMessage(this.props.localSignUp.result.descriptor);
    } else if (isDone(this.props.facebookSignUp) && this.props.facebookSignUp.result.result === false) {
      errorMessage = this.props.intl.formatMessage(this.props.facebookSignUp.result.descriptor);
    }

    return (
      <FullscreenForm>
        {formIsBusy ? <CircularProgress style={styles.progressOverlay} /> : null}

        <h1 style={{ textAlign: 'left' }}>
          {this.props.intl.formatMessage(messages.heading, {
            service: this.props.intl.formatMessage(Messages.service),
          })}
        </h1>

        {
          errorMessage ? (
            <div style={styles.errorMessage}>
              <FontIcon className="material-icons" color={Colors.red500} style={styles.errorIcon}>error_outline</FontIcon>
              {errorMessage}
            </div>
          ): null
        }

        <form onSubmit={e => this.handleLocalSignUpSubmit(e)} noValidate={true}>
          <div style={styles.inputRow}>
            <TextField
              type="email"
              hintText={this.props.intl.formatMessage(Messages.email)}
              errorText={emailValidation.error}
              onChange={e => this.handleEmailChange(e)}
              style={styles.textfield}
              inputStyle={styles.input}
              errorStyle={styles.textfieldError}
              disabled={formIsBusy}
            />

            {isRunning(this.props.validateEmail) ? <CircularProgress size={0.3} style={styles.progress} /> : null}

            <FontIcon className="material-icons" style={Object.assign({}, styles.textfieldCheck, {
              display: emailValidation.valid ? 'inline-block' : 'none',
            })}>check</FontIcon>
          </div>

          <div style={styles.inputRow}>
            <TextField
              type="password"
              hintText={this.props.intl.formatMessage(Messages.password)}
              errorText={passwordValidation.error}
              onChange={e => this.handlePasswordChange(e)}
              style={styles.textfield}
              inputStyle={styles.input}
              errorStyle={styles.textfieldError}
              disabled={formIsBusy}
            />

            <FontIcon className="material-icons" style={Object.assign({}, styles.textfieldCheck, {
              display: passwordValidation.valid ? 'inline-block' : 'none',
            })}>check</FontIcon>
          </div>

          <RaisedButton
            type="submit"
            secondary={true}
            fullWidth={true}
            style={styles.loginButton}
            label={this.props.intl.formatMessage(Messages.signup)}
            disabled={formIsBusy || localLoginSubmitDisabled}
          />
        </form>

        <RaisedButton
          label={this.props.intl.formatMessage(Messages.facebookLogin)}
          backgroundColor={'#3b5998'}
          labelStyle={{ color: Colors.white }}
          style={styles.facebookLoginButton}
          fullWidth={true}
          onTouchTap={() => this.handleFacebookSignUpSubmit()}
          disabled={formIsBusy}
        />

        <div style={styles.loginContainer}>
          <span style={styles.loginMessage}><FormattedMessage {...messages.haveAccount} /> </span>
          <Link to="/login">
            <span style={styles.loginLink}><FormattedMessage {...Messages.login} /></span>
          </Link>
        </div>
      </FullscreenForm>
    );
  }
}

export default JoinForm;
