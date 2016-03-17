import * as React from 'react';
import { Link } from 'react-router';
import { Styles } from 'material-ui';
import Colors = require('material-ui/lib/styles/colors');
const TextField = require('material-ui/lib/text-field');
const Paper = require('material-ui/lib/paper');
const Divider = require('material-ui/lib/divider');
const RaisedButton = require('material-ui/lib/raised-button');

import Wrapper from '../../../components/Wrapper';

interface LoginFormProps extends React.Props<LoginForm> {
  localLoginErrorMessage: string;
  facebookLoginErrorMessage: string;
  onLocalLoginSubmit: (email, password) => any;
  onFacebookLoginSubmit: () => any;
}

class LoginForm extends React.Component<LoginFormProps, {}> {
  handleLoginWithFacebook() {
    this.props.onFacebookLoginSubmit();
  }

  render() {
    return (
      <div style={styles.root}>
        <Wrapper width={400}>
          <div style={styles.logoContainer}>
            <Link to="/"><h1 style={styles.logo}>PASTA</h1></Link>
          </div>
          <Paper style={styles.paper}>
            <h1>Log in</h1>

            <div style={styles.button}>
              <RaisedButton label="Login with facebook"
                            onTouchTap={() => this.handleLoginWithFacebook()}
                            backgroundColor={'#3b5998'} labelColor={Colors.white}
                            fullWidth={true}
              />
            </div>

            {this.props.facebookLoginErrorMessage}

            <Divider />

            <Paper zDepth={1} style={{marginTop: 20}}>
              <TextField hintText="Email" type="email"
                         style={styles.input} underlineShow={false} fullWidth={true}
              />
              <Divider />
              <TextField hintText="Password" type="password"
                         style={styles.input} underlineShow={false} fullWidth={true}
              />
              <Divider />
            </Paper>

            <RaisedButton primary={true} fullWidth={true} label="Login" style={styles.loginButton} />

            <div style={styles.joinContainer}>
              <span style={styles.joinMessage}>New to Pasta? </span>
              <Link to="/join"><span style={styles.joinLink}>Sign up</span></Link>
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
