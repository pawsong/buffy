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
import Footer from '../../components/Footer';
import LoggedInNavbar from '../../components/LoggedInNavbar';

interface LoggedInHandlerProps extends RouteComponentProps<{}, {}> {
  user?: User;
  requestLogout?: () => any;
}

@connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout: requestLogout,
})
class LoggedInHandler extends React.Component<LoggedInHandlerProps, {}> {
  handleLogout() {
    this.props.requestLogout();
  }

  render() {
    return (
      <div>
        <LoggedInNavbar user={this.props.user} onLogout={this.handleLogout.bind(this)} location={this.props.location} />
        {this.props.children}
        <Footer />
      </div>
    );
  }
}

export default LoggedInHandler;
