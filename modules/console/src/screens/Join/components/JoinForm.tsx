import * as React from 'react';
import { Link } from 'react-router';
import { Styles } from 'material-ui';
import Colors from 'material-ui/lib/styles/colors';
const TextField = require('material-ui/lib/text-field');
const Paper = require('material-ui/lib/paper');
const Divider = require('material-ui/lib/divider');
import RaisedButton from 'material-ui/lib/raised-button';
import FontIcon from 'material-ui/lib/font-icon';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
const objectAssign = require('object-assign');
import { isCancelError } from 'redux-saga';
import { call, put } from 'redux-saga/effects';
import { replace } from 'react-router-redux';
const isEmail = require('validator/lib/isEmail');
import CircularProgress from 'material-ui/lib/circular-progress';
import ActionPets from 'material-ui/lib/svg-icons/action/pets';
import { TouchTapEvent } from 'material-ui';
import { saga, SagaProps, ImmutableTask, request, wait, isRunning, isDone } from '../../../saga';
import Messages from '../../../constants/Messages';

import Wrapper from '../../../components/Wrapper';

import { localLogin, facebookLogin } from '../../Login/sagas';

const PASSWORD_MIN_LENGTH = 6;

const styles = {
  root: {
    marginTop: 70,
  },
  logoContainer: {
    textDecoration: 'none',
    textAlign: 'center',
    marginBottom: 36,
  },
  heading: {
    fontWeight: 'normal',
  },
  logo: {
    width: 40,
    height: 40,
  },
  paper: {
    position: 'relative',
    padding: 20,
  },
  facebookLoginButton: {
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
  input: {
    marginLeft: 20,
    marginBottom: 10,
    width: 'calc(100% - 40px)',
  },
  loginButton: {
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
    color: Colors.cyan500,
    fontSize: 20,
    top: 6,
    left: 6,
  },
  progress: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -9,
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
  passwordTooShort: {
    id: 'passwordTooShort',
    description: 'Warning message for password value length of which is smaller than given number',
    defaultMessage: 'Your password must be at least {minimum} characters',
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
  name?: string;
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
    try {
      // Wait for 1 sec to prevent unnecessary validation
      yield call(wait, 1000);

      if (!isEmail(email)) {
        return {
          valid: false,
          error: formatMessage(messages.invalidEmail),
        };
      }

      const response = yield call(request.get, `${CONFIG_AUTH_SERVER_URL}/signup/local/exists/${email}`);
      const exists = response.data.result;
      return exists ? {
        valid: false,
        error: formatMessage(messages.emailAlreadyExists),
      } : {
        valid: true,
        error: '',
      };
    } catch(error) {
      if (!isCancelError(error)) throw error;
    }
  },
  localSignUp: function* (name, email, password) {
    try {
      const response = yield call(request.post, `${CONFIG_AUTH_SERVER_URL}/signup/local`, {
        name,
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
    } catch(error) {
      if (!isCancelError(error)) throw error;
    }
  },
  facebookSignUp: function* () {
    try {
      const result = yield call(facebookLogin);
      if (result) {
        yield put(replace('/'));
      }
      return { result, descriptor: Messages.facebookLoginFailed };
    } catch(error) {
      if (!isCancelError(error)) throw error;
    }
  },
})
class JoinForm extends React.Component<JoinFormProps, JoinFormState> {
  defaultValidation: ValidateResult;

  constructor(props, context) {
    super(props, context);
    this.state = {
      name: '',
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

  handleNameChange(e) {
    this.setState({ name: e.target.value });
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
    this.props.runSaga(this.props.localSignUp, this.state.name, this.state.email, this.state.password);
  }

  handleFacebookSignUpSubmit() {
    this.cancelSignUpRequests();
    this.props.runSaga(this.props.facebookSignUp);
  }

  validateForm() {
    return [
      this.validateName().valid,
      isDone(this.props.validateEmail) ? this.props.validateEmail.result.valid : false,
      this.validatePassword().valid,
    ].reduce((prev, cur) => prev && cur);
  }

  validateName(): ValidateResult {
    if (!this.state.name) {
      return {
        valid: false,
        error: this.props.intl.formatMessage(messages.nameRequired),
      };
    }
    return { valid: true, error: '' };
  }

  validatePassword(): ValidateResult {
    if (!this.state.password) {
      return {
        valid: false,
        error: this.props.intl.formatMessage(messages.passwordRequired),
      };
    }

    if (this.state.password.length < PASSWORD_MIN_LENGTH) {
      return {
        valid: false,
        error: this.props.intl.formatMessage(messages.passwordTooShort, { minimum: PASSWORD_MIN_LENGTH }),
      };
    }

    return { valid: true, error: '' };
  }

  isFormBusy() {
    return isRunning(this.props.localSignUp) || isRunning(this.props.facebookSignUp);
  }

  render() {
    let nameValidation = this.defaultValidation;
    if (this.state.haveSubmitted || this.state.name) {
      nameValidation = this.validateName();
    }

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
      nameValidation.valid,
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
      <div style={styles.root}>
        <Wrapper width={400}>
          <div style={styles.logoContainer}>
            <Link to="/"><ActionPets style={styles.logo} /></Link>
          </div>
          <Paper style={styles.paper}>
            {formIsBusy ? <CircularProgress style={styles.progressOverlay} /> : null}

            <h1 style={styles.heading}>
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
              <TextField type="text"
                         hintText={this.props.intl.formatMessage(Messages.name)}
                         errorText={nameValidation.error}
                         onChange={e => this.handleNameChange(e)}
                         style={styles.input}
                         errorStyle={styles.textfieldError}
                         disabled={formIsBusy}
              />

              <FontIcon className="material-icons" style={objectAssign({}, styles.textfieldCheck, {
                display: nameValidation.valid ? 'inline-block' : 'none',
              })}>check</FontIcon>

              <TextField type="email"
                         hintText={this.props.intl.formatMessage(Messages.email)}
                         errorText={emailValidation.error}
                         onChange={e => this.handleEmailChange(e)}
                         style={styles.input}
                         errorStyle={styles.textfieldError}
                         disabled={formIsBusy}
              />

              {isRunning(this.props.validateEmail) ? <CircularProgress size={0.3} style={styles.progress} /> : null}

              <FontIcon className="material-icons" style={objectAssign({}, styles.textfieldCheck, {
                display: emailValidation.valid ? 'inline-block' : 'none',
              })}>check</FontIcon>

              <TextField type="password"
                         hintText={this.props.intl.formatMessage(Messages.password)}
                         errorText={passwordValidation.error}
                         onChange={e => this.handlePasswordChange(e)}
                         style={styles.input}
                         errorStyle={styles.textfieldError}
                         disabled={formIsBusy}
              />

              <FontIcon className="material-icons" style={objectAssign({}, styles.textfieldCheck, {
                display: passwordValidation.valid ? 'inline-block' : 'none',
              })}>check</FontIcon>

              <RaisedButton type="submit"
                            primary={true} fullWidth={true} style={styles.loginButton}
                            label={this.props.intl.formatMessage(Messages.signup)}
                            disabled={formIsBusy || localLoginSubmitDisabled}
              />
            </form>

            <RaisedButton label={this.props.intl.formatMessage(Messages.facebookLogin)}
                          backgroundColor={'#3b5998'} labelColor={Colors.white}
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
          </Paper>
        </Wrapper>
      </div>
    );
  }
}

export default JoinForm;
