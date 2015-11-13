import React from 'react';
import { History } from 'react-router';
import { connect } from 'react-redux';
import facebook from '../libs/facebook';
import { loginWithFacebook } from '../libs/auth';
import {
  SET_USER_DATA,
} from '../constants/ActionTypes';
import {
  Card,
  CardHeader,
  Avatar,
  CardMedia,
  CardTitle,
  CardActions,
  FlatButton,
  CardText,
} from 'material-ui';

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

class Login extends React.Component {
  handleClick() {
    facebook.retrieveToken().then(result => {
      if (!result) {
        console.log('failed...');
        return;
      }
      return loginWithFacebook(result.token);
    }).then(result => {
      this.props.setUser(result);
      const { location, history } = this.props;
      history.replaceState(null, location.query.n || '/', {});
    }).catch(err => {
      console.error(err);
    });
  }

  render() {
    return (
      <div style={styles.container}>
        <Card style={styles.card}>
          <CardMedia overlay={<CardTitle title="PROJECT PASTA"/>}>
            <img src="/assets/fox.jpg"/>
          </CardMedia>
          <CardActions style={styles.button}>
            <FlatButton label="Login with facebook" onClick={this.handleClick.bind(this)}/>
          </CardActions>
        </Card>
      </div>
    );
  }
}

export default connect(
  null,
  dispatch => ({
    setUser: user => dispatch({ type: SET_USER_DATA, user }),
  })
)(Login);
