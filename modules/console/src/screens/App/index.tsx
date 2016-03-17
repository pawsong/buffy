import * as React from 'react';
import { connect } from 'react-redux';
import { State } from '../../reducers';
import {
  User,
 } from '../../reducers/users';
import {
  requestLogout,
} from '../../actions/auth';
import AppNavbar from './components/AppNavbar';

interface AppProps extends React.Props<AppHandler> {
  user: User;
  requestLogout: () => any;
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
        <AppNavbar user={this.props.user} onLogout={this.handleLogout.bind(this)}/>
        {this.props.children}
      </div>
    );
  }
}

export default AppHandler;
