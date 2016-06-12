import * as React from 'react';
import { Link } from 'react-router';
import * as Colors from 'material-ui/styles/colors';
import TextField from 'material-ui/TextField';
import Paper from 'material-ui/Paper';
import Divider from 'material-ui/Divider';
import RaisedButton from 'material-ui/RaisedButton';
import FontIcon from 'material-ui/FontIcon';
import { call, put } from 'redux-saga/effects';
import { replace } from 'react-router-redux';
import CircularProgress from 'material-ui/CircularProgress';
import BuffyIcon from '../../../components/BuffyIcon';
import { saga, ImmutableTask, SagaProps, isRunning, isDone } from '../../../saga';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./LoginForm.css');

import Wrapper from '../../../components/Wrapper';

import { localLogin, facebookLogin } from '../sagas';

const inlineStyles = {
  progressOverlay: {
    position: 'absolute',
    margin: 0,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 1,
  },
  errorIcon: {
    top: 6, right: 3,
  },
  loginButton: {
    marginTop: 20,
    width: '100%',
  },
  facebookLoginButton: {
    marginTop: 17,
    width: '100%',
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
  location: HistoryModule.Location;
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
  localLogin: function* (locationDesc: HistoryModule.LocationDescriptor, email: string, password: string) {
    const result = yield call(localLogin, email, password);
    if (result) yield put(replace(locationDesc));

    return { result };
  },
  facebookLogin: function* (locationDesc: HistoryModule.LocationDescriptor) {
    const result = yield call(facebookLogin);
    if (result) yield put(replace(locationDesc));

    return { result };
  },
})
@withStyles(styles)
class LoginForm extends React.Component<LoginFormProps, LoginFormState> {
  nextLocationDesc: HistoryModule.LocationDescriptor;

  constructor(props, context) {
    super(props, context);
    this.state = { email: '', password: '' };

    this.nextLocationDesc = { pathname: '/', query: {} };

    const nextLocation = this.props.location.query['n'];
    if (nextLocation) {
      try {
        const { p, q } = JSON.parse(nextLocation);
        if (p) this.nextLocationDesc['pathname'] = p;
        if (q) this['query'] = q;
      } catch(error) {}
    }
  }

  componentWillUnmount() {
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
    this.props.runSaga(this.props.localLogin, this.nextLocationDesc, this.state.email, this.state.password);
  }

  handleLoginWithFacebook() {
    this.cancelLoginRequests();
    this.props.runSaga(this.props.facebookLogin, this.nextLocationDesc);
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
      <div className={styles.root}>
        <Wrapper width={400}>
          <div className={styles.logoContainer}>
            <Link to="/">
            <BuffyIcon className={styles.logo}/>
            </Link>
          </div>
          <Paper className={styles.paper}>
            {formIsBusy ? <CircularProgress style={inlineStyles.progressOverlay} /> : null}

            <h1>
              {this.props.intl.formatMessage(messages.heading, {
                service: this.props.intl.formatMessage(Messages.service),
              })}
            </h1>

            {
              errorMessage ? (
                <div className={styles.errorMessage}>
                  <FontIcon className="material-icons" color={Colors.red500} style={inlineStyles.errorIcon}>error_outline</FontIcon>
                  {errorMessage}
                </div>
              ): null
            }

            <form onSubmit={e => this.handleLocalLogin(e)} noValidate={true}>
              <TextField type="email" className={styles.input} fullWidth={true}
                         hintText={this.props.intl.formatMessage(Messages.email)}
                         onChange={e => this.handleEmailChange(e)}
                         disabled={formIsBusy}
              />
              <TextField type="password" className={styles.input} fullWidth={true}
                         hintText={this.props.intl.formatMessage(Messages.password)}
                         onChange={e => this.handlePasswordChange(e)}
                         disabled={formIsBusy}
              />
              <RaisedButton type="submit"
                            secondary={true} fullWidth={true} style={inlineStyles.loginButton}
                            label={this.props.intl.formatMessage(Messages.login)}
                            disabled={formIsBusy}
              />
            </form>

            <RaisedButton label={this.props.intl.formatMessage(Messages.facebookLogin)}
                          style={inlineStyles.facebookLoginButton}
                          onTouchTap={() => this.handleLoginWithFacebook()}
                          backgroundColor={'#3b5998'} labelColor={Colors.white}
                          fullWidth={true}
                          disabled={formIsBusy}
            />

            <div className={styles.joinContainer}>
              <span className={styles.joinMessage}>{
                this.props.intl.formatMessage(messages.newToService, {
                  service: this.props.intl.formatMessage(Messages.service),
                })
              } </span>
              <Link to="/join">
                <span className={styles.joinLink}>
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
