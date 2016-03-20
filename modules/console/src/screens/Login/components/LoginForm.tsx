import * as React from 'react';
import { Link } from 'react-router';
import { Styles } from 'material-ui';
import Colors from 'material-ui/lib/styles/colors';
import TextField from 'material-ui/lib/text-field';
import Paper from 'material-ui/lib/paper';
import Divider from 'material-ui/lib/divider';
import RaisedButton from 'material-ui/lib/raised-button';
import FontIcon from 'material-ui/lib/font-icon';
import { isCancelError } from 'redux-saga';
import { call, put } from 'redux-saga/effects';
import { replace } from 'react-router-redux';
import CircularProgress from 'material-ui/lib/circular-progress';
import { saga, ImmutableTask, SagaProps, isRunning, isDone } from '../../../saga';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

import Wrapper from '../../../components/Wrapper';

import { localLogin, facebookLogin } from '../sagas';

const styles = {
  root: {
    marginTop: 70,
  },
  logoContainer: {
    textDecoration: 'none',
    textAlign: 'center',
    marginBottom: 15,
  },
  logo: {
    color: Colors.black,
    display: 'inline-block',
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
  joinContainer: {
    marginTop: 20,
    textAlign: 'center',
  },
  joinMessage: {
    color: Colors.lightBlack,
  },
  joinLink: {
    display: 'inline-block',
    color: Colors.cyan500,
  },
  divider: {
    margin: '20 0',
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
    id: 'login.form.heading',
    description: 'Login form heading message',
    defaultMessage: 'Log in to {service}',
  },
  newToService: {
    id: 'login.form.newToService',
    description: 'Ask if signup is needed or not',
    defaultMessage: 'New to {service}?',
  },
});

interface LoginFormProps extends React.Props<LoginForm>, SagaProps {
  localLoginErrorMessage: string;
  facebookLoginErrorMessage: string;
  onLocalLoginSubmit: (email, password) => any;
  onFacebookLoginSubmit: () => any;
  intl?: InjectedIntlProps;
  localLogin?: ImmutableTask<LoginResult>;
  facebookLogin?: ImmutableTask<LoginResult>;
}

interface LoginFormState {
  email?: string;
  password?: string;
}

interface LoginResult {
  result: boolean;
}

@injectIntl
@saga({
  localLogin: function* (email: string, password: string) {
    try {
      const result = yield call(localLogin, email, password);
      if (result) {
        yield put(replace('/'));
      }
      return { result };
    } catch(error) {
      if (!isCancelError(error)) throw error;
    }
  },
  facebookLogin: function* () {
    try {
      const result = yield call(facebookLogin);
      if (result) {
        yield put(replace('/'));
      }
      return { result };
    } catch(error) {
      if (!isCancelError(error)) throw error;
    }
  },
})
class LoginForm extends React.Component<LoginFormProps, LoginFormState> {
  constructor(props, context) {
    super(props, context);
    this.state = {
      email: '', password: '',
    };
  }

  componentWillUnmount() {
    console.log('will unmount');
    this.cancelLoginRequests();
  }

  handleEmailChange(e) {
    this.setState({ email: e.target.value });
  }

  handlePasswordChange(e) {
    this.setState({ password: e.target.value });
  }

  cancelLoginRequests() {
    this.props.cancelSaga(this.props.localLogin);
    this.props.cancelSaga(this.props.facebookLogin);
  }

  handleLocalLogin(e: React.FormEvent) {
    e.preventDefault();
    this.cancelLoginRequests();
    this.props.runSaga(this.props.localLogin, this.state.email, this.state.password);
  }

  handleLoginWithFacebook() {
    this.cancelLoginRequests();
    this.props.runSaga(this.props.facebookLogin);
  }

  isFormBusy() {
    return isRunning(this.props.localLogin) || isRunning(this.props.facebookLogin);
  }

  render() {
    const formIsBusy = this.isFormBusy();

    let errorMessage = '';
    if (isDone(this.props.localLogin) && this.props.localLogin.result.result === false) {
      errorMessage = this.props.intl.formatMessage(Messages.localLoginFailed);
    } else if (isDone(this.props.facebookLogin) && this.props.facebookLogin.result.result === false) {
      errorMessage = this.props.intl.formatMessage(Messages.facebookLoginFailed);
    }

    return (
      <div style={styles.root}>
        <Wrapper width={400}>
          <div style={styles.logoContainer}>
            <Link to="/"><h1 style={styles.logo}>{this.props.intl.formatMessage(Messages.service)}</h1></Link>
          </div>
          <Paper style={styles.paper}>
            {formIsBusy ? <CircularProgress style={styles.progressOverlay} /> : null}

            <h1>
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

            <form onSubmit={e => this.handleLocalLogin(e)} noValidate={true}>
              <TextField type="email" style={styles.input} fullWidth={true}
                         hintText={this.props.intl.formatMessage(Messages.email)}
                         onChange={e => this.handleEmailChange(e)}
                         disabled={formIsBusy}
              />
              <TextField type="password" style={styles.input} fullWidth={true}
                         hintText={this.props.intl.formatMessage(Messages.password)}
                         onChange={e => this.handlePasswordChange(e)}
                         disabled={formIsBusy}
              />
              <RaisedButton type="submit"
                            primary={true} fullWidth={true} style={styles.loginButton}
                            label={this.props.intl.formatMessage(Messages.login)}
                            disabled={formIsBusy}
              />
            </form>

            <RaisedButton label={this.props.intl.formatMessage(Messages.facebookLogin)}
                          style={styles.facebookLoginButton}
                          onTouchTap={() => this.handleLoginWithFacebook()}
                          backgroundColor={'#3b5998'} labelColor={Colors.white}
                          fullWidth={true}
                          disabled={formIsBusy}
            />

            <div style={styles.joinContainer}>
              <span style={styles.joinMessage}>{
                this.props.intl.formatMessage(messages.newToService, {
                  service: this.props.intl.formatMessage(Messages.service),
                })
              } </span>
              <Link to="/join">
                <span style={styles.joinLink}>
                  {this.props.intl.formatMessage(Messages.signup)}
                </span>
              </Link>
            </div>
          </Paper>
        </Wrapper>
      </div>
    );
  }
}

export default LoginForm;
