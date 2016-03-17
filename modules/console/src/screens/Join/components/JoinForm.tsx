import * as React from 'react';
import { Link } from 'react-router';
import { Styles } from 'material-ui';
import Colors = require('material-ui/lib/styles/colors');
const TextField = require('material-ui/lib/text-field');
const Paper = require('material-ui/lib/paper');
const Divider = require('material-ui/lib/divider');
const RaisedButton = require('material-ui/lib/raised-button');

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

class JoinForm extends React.Component<{}, {}> {
  render() {
    return (
      <div style={styles.root}>
        <Wrapper width={400}>
          <div style={styles.logoContainer}>
            <Link to="/"><h1 style={styles.logo}>PASTA</h1></Link>
          </div>
          <Paper style={styles.paper}>
            <h1>Join Pasta</h1>

            <div style={styles.button}>
              <RaisedButton label="Continue with facebook"
                            backgroundColor={'#3b5998'} labelColor={Colors.white}
                            fullWidth={true}
              />
            </div>

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

            <RaisedButton primary={true} fullWidth={true} label="Sign up" style={styles.loginButton} />

            <div style={styles.loginContainer}>
              <span style={styles.loginMessage}>Have account? </span>
              <Link to="/login"><span style={styles.loginLink}>Log in</span></Link>
            </div>
          </Paper>
        </Wrapper>
      </div>
    );
  }
}

export default JoinForm;
