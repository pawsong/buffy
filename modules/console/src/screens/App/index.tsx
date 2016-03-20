import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { State } from '../../reducers';
import {
  User,
 } from '../../reducers/users';
import {
  requestLogout,
} from '../../actions/auth';
import AppNavbar from './components/AppNavbar';

interface AppProps extends RouteComponentProps<{}, {}> {
  user?: User;
  requestLogout?: () => any;
}

@connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout: requestLogout,
})
class AppHandler extends React.Component<AppProps, {}> {
  handleLogout() {
    this.props.requestLogout();
  }

  render() {
    return (
      <div>
        <AppNavbar user={this.props.user} onLogout={this.handleLogout.bind(this)} location={this.props.location} />
        {this.props.children}
      </div>
    );
  }
}

export default AppHandler;
