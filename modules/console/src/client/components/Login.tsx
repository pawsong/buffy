import * as React from 'react';
import { History } from 'react-router';
import { connect } from 'react-redux';
import facebook from '../libs/facebook';
import {
  loginWithFacebook,
  loginAnonymously,
} from '../libs/auth';
import * as ActionTypes from '../constants/ActionTypes';

import Avatar = require('material-ui/lib/avatar');
import Card = require('material-ui/lib/card/card');
import CardHeader = require('material-ui/lib/card/card-header');
import CardMedia = require('material-ui/lib/card/card-media');
import CardTitle = require('material-ui/lib/card/card-title');
import CardActions = require('material-ui/lib/card/card-actions');
import CardText = require('material-ui/lib/card/card-text');
import FlatButton = require('material-ui/lib/flat-button');

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  card: {
    width: '40%',
  },
  button: {
    float: 'right',
  },
}

interface LoginProps extends React.Props<Login> {
  login: (user: any) => {};
  location: any;
  router: any;
}

class Login extends React.Component<LoginProps, {}> {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  handleClick() {
    Promise.resolve()
    .then(() => facebook.retrieveToken())
    .then(result => loginWithFacebook(result.token))
    .then(result => {
      this.props.login(result);
      this.context['router'].replace({ pathname: '/' });
    })
    .catch(err => console.error(err));
  }

  render() {
    return (
      <div style={styles.container}>
        <Card style={styles.card}>
          <CardMedia overlay={<CardTitle title="PROJECT PASTA"/>}>
            <img src="/assets/fox.jpg"/>
          </CardMedia>
          <CardActions style={styles.button}>
            <FlatButton label="Login with facebook" onTouchTap={this.handleClick.bind(this)}/>
          </CardActions>
        </Card>
      </div>
    );
  }
}

export default connect(
  null,
  dispatch => ({
    login: user => dispatch({ type: ActionTypes.AUTH_LOGIN_SUCCEED, user }),
  })
)(Login);
