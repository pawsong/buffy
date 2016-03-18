import * as React from 'react';
import { Link } from 'react-router';
import { Styles } from 'material-ui';
import Colors from 'material-ui/lib/styles/colors';
import TextField from 'material-ui/lib/text-field';
import Paper from 'material-ui/lib/paper';
import Divider from 'material-ui/lib/divider';
import RaisedButton from 'material-ui/lib/raised-button';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

import Wrapper from '../../../components/Wrapper';

const messages = defineMessages({
  heading: {
    id: 'login.form.heading',
    description: 'Login form heading message',
    defaultMessage: 'Log in',
  },
  facebookLogin: {
    id: 'login.form.facebookLogin',
    description: 'Facebook login button label',
    defaultMessage: 'Login with facebook',
  },
  newToService: {
    id: 'login.form.newToService',
    description: 'Ask if signup is needed or not',
    defaultMessage: 'New to {service}?',
  },
});

interface LoginFormProps extends React.Props<LoginForm> {
  localLoginErrorMessage: string;
  facebookLoginErrorMessage: string;
  onLocalLoginSubmit: (email, password) => any;
  onFacebookLoginSubmit: () => any;
  intl?: InjectedIntlProps;
}

@injectIntl
class LoginForm extends React.Component<LoginFormProps, {}> {
  handleLoginWithFacebook() {
    this.props.onFacebookLoginSubmit();
  }

  render() {
    return (
      <div style={styles.root}>
        <Wrapper width={400}>
          <div style={styles.logoContainer}>
            <Link to="/"><h1 style={styles.logo}>{this.props.intl.formatMessage(Messages.service)}</h1></Link>
          </div>
          <Paper style={styles.paper}>
            <FormattedMessage tagName="h1" {...messages.heading} />

            <div style={styles.button}>
              <RaisedButton label={this.props.intl.formatMessage(messages.facebookLogin)}
                            onTouchTap={() => this.handleLoginWithFacebook()}
                            backgroundColor={'#3b5998'} labelColor={Colors.white}
                            fullWidth={true}
              />
            </div>

            {this.props.facebookLoginErrorMessage}

            <Divider />

            <Paper zDepth={1} style={{marginTop: 20}}>
              <TextField type="email" style={styles.input} underlineShow={false} fullWidth={true}
                         hintText={this.props.intl.formatMessage(Messages.email)}
              />
              <Divider />
              <TextField type="password" style={styles.input} underlineShow={false} fullWidth={true}
                         hintText={this.props.intl.formatMessage(Messages.password)}
              />
              <Divider />
            </Paper>

            <RaisedButton primary={true} fullWidth={true} style={styles.loginButton}
                          label={this.props.intl.formatMessage(Messages.login)}
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
    padding: 20,
  },
  button: {
    marginTop: 20,
    marginBottom: 20,
  },
  input: {
    marginLeft: 20,
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
};
