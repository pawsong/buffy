import * as React from 'react';
import { Link } from 'react-router';
import { Styles } from 'material-ui';
import Colors from 'material-ui/lib/styles/colors';
const TextField = require('material-ui/lib/text-field');
const Paper = require('material-ui/lib/paper');
const Divider = require('material-ui/lib/divider');
const RaisedButton = require('material-ui/lib/raised-button');
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

import Wrapper from '../../../components/Wrapper';

const styles = {
  root: {
    marginTop: 100,
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
};

interface JoinFormProps extends React.Props<JoinForm> {
  intl?: InjectedIntlProps;
}

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
});

@injectIntl
class JoinForm extends React.Component<JoinFormProps, {}> {
  render() {
    return (
      <div style={styles.root}>
        <Wrapper width={400}>
          <div style={styles.logoContainer}>
            <Link to="/"><h1 style={styles.logo}>{this.props.intl.formatMessage(Messages.service)}</h1></Link>
          </div>
          <Paper style={styles.paper}>
            <h1>{this.props.intl.formatMessage(messages.heading, {
              service: this.props.intl.formatMessage(Messages.service),
            })}</h1>

            <div style={styles.button}>
              <RaisedButton label={this.props.intl.formatMessage(Messages.facebookLogin)}
                            backgroundColor={'#3b5998'} labelColor={Colors.white}
                            fullWidth={true}
              />
            </div>

            <Divider />

            <Paper zDepth={1} style={{marginTop: 20}}>
              <TextField type="email"
                         hintText={this.props.intl.formatMessage(Messages.email)}
                         style={styles.input} underlineShow={false} fullWidth={true}
              />
              <Divider />
              <TextField type="password"
                         hintText={this.props.intl.formatMessage(Messages.password)}
                         style={styles.input} underlineShow={false} fullWidth={true}
              />
              <Divider />
            </Paper>

            <RaisedButton primary={true} fullWidth={true} style={styles.loginButton}
                          label={this.props.intl.formatMessage(Messages.signup)}
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
