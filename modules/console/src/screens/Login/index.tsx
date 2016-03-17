import * as React from 'react';
import { connect } from 'react-redux';
import { State } from '../../reducers';
import { AuthState } from '../../reducers/auth';
import {
  requestLocalLogin,
  requestFacebookLogin,
} from '../../actions/auth';

import LoginNavbar from './components/LoginNavbar';
import LoginForm from './components/LoginForm';
import Footer from '../../components/Footer';

interface LoginHandlerProps extends React.Props<LoginHandler> {
  localLoginErrorMessage: string;
  facebookLoginErrorMessage: string;
  requestLocalLogin: (email: string, password: string) => any;
  requestFacebookLogin: () => any;
}

@connect<LoginHandlerProps>((state: State) => ({
  localLoginErrorMessage: state.auth.localLoginErrorMessage,
  facebookLoginErrorMessage: state.auth.facebookLoginErrorMessage,
}), {
  requestLocalLogin: requestLocalLogin,
  requestFacebookLogin: requestFacebookLogin,
})
class LoginHandler extends React.Component<LoginHandlerProps, {}> {
  render() {
    return (
      <div>
        <LoginForm onLocalLoginSubmit={(email, password) => this.props.requestLocalLogin(email, password)}
                   localLoginErrorMessage={this.props.localLoginErrorMessage}
                   onFacebookLoginSubmit={() => this.props.requestFacebookLogin()}
                   facebookLoginErrorMessage={this.props.facebookLoginErrorMessage}
        />
      </div>
    );
  }
}

export default LoginHandler;
