import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import { EnhancedTitle, Meta } from '../../hairdresser';

import { State } from '../../reducers';
import { AuthState } from '../../reducers/auth';
import {
  requestLocalLogin,
  requestFacebookLogin,
} from '../../actions/auth';

import LoginForm from './components/LoginForm';
import Footer from '../../components/Footer';

interface LoginHandlerProps extends RouteComponentProps<{}, {}> {
  localLoginErrorMessage: string;
  facebookLoginErrorMessage: string;
  requestLocalLogin: (email: string, password: string) => any;
  requestFacebookLogin: () => any;
  intl?: InjectedIntlProps;
}

const messages = defineMessages({
  title: {
    id: 'app.login.title',
    description: 'Title of login page',
    defaultMessage: 'Log in to {service}',
  },
});

@injectIntl
@(connect((state: State) => ({
  localLoginErrorMessage: state.auth.localLoginErrorMessage,
  facebookLoginErrorMessage: state.auth.facebookLoginErrorMessage,
}), {
  requestLocalLogin: requestLocalLogin,
  requestFacebookLogin: requestFacebookLogin,
}) as any)
class LoginHandler extends React.Component<LoginHandlerProps, {}> {
  render() {
    return (
      <div>
        <EnhancedTitle>
          {this.props.intl.formatMessage(messages.title, {
            service: this.props.intl.formatMessage(Messages.service),
          })}
        </EnhancedTitle>
        <LoginForm location={this.props.location}
                   onLocalLoginSubmit={(email, password) => this.props.requestLocalLogin(email, password)}
                   localLoginErrorMessage={this.props.localLoginErrorMessage}
                   onFacebookLoginSubmit={() => this.props.requestFacebookLogin()}
                   facebookLoginErrorMessage={this.props.facebookLoginErrorMessage}
        />
      </div>
    );
  }
}

export default LoginHandler;
