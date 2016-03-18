import * as React from 'react';
import { connect } from 'react-redux';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';

import Messages from '../../constants/Messages';

import { Title, Meta } from '../../hairdresser';
import { META_TITLE } from '../../constants/HeadSelectors';

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
  intl?: InjectedIntlProps;
}

const messages = defineMessages({
  title: {
    id: 'app.login.title',
    description: 'Title of login page',
    defaultMessage: 'Log in to Pasta',
  },
});

@injectIntl
@connect<LoginHandlerProps>((state: State) => ({
  localLoginErrorMessage: state.auth.localLoginErrorMessage,
  facebookLoginErrorMessage: state.auth.facebookLoginErrorMessage,
}), {
  requestLocalLogin: requestLocalLogin,
  requestFacebookLogin: requestFacebookLogin,
})
class LoginHandler extends React.Component<LoginHandlerProps, {}> {
  render() {
    const title = this.props.intl.formatMessage(messages.title);
    return (
      <div>
        <Title>{title}</Title>
        <Meta attrs={META_TITLE} values={{ content: title }}/>
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
