import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { push } from 'react-router-redux';
import ToolbarGroup from 'material-ui/Toolbar/ToolbarGroup';
import FlatButton from 'material-ui/FlatButton';
import * as Colors from 'material-ui/styles/colors';

import { State } from '../../reducers';
import {
  User,
 } from '../../reducers/users';
import {
  requestLogout,
} from '../../actions/auth';
import Footer from '../../components/Footer';
import LoggedInNavbar from '../../components/LoggedInNavbar';

import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

const styles = {
  button: {
    color: Colors.white,
    marginLeft: 25,
    marginRight: 0,
  },
};

interface LoggedInHandlerProps extends RouteComponentProps<{}, {}> {
  user?: User;
  requestLogout?: () => any;
  intl?: InjectedIntlProps;
  push?: any;
}

@(connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout: requestLogout,
  push,
}) as any)
@injectIntl
class LoggedInHandler extends React.Component<LoggedInHandlerProps, {}> {
  handleCreateButtonClick = () => {
    this.props.push('/model/edit');
  }

  renderLeftToolbarGroup() {
    return (
      <div style={{ marginLeft: 25, marginTop: 10 }}>
        <FlatButton
          label={this.props.intl.formatMessage(Messages.create)}
          style={styles.button}
          onTouchTap={this.handleCreateButtonClick}
          backgroundColor={Colors.pinkA200}
          hoverColor={Colors.pinkA100}
        />
      </div>
    );
  }

  render() {
    return (
      <div>
        <LoggedInNavbar
          user={this.props.user}
          onLogout={() => this.props.requestLogout()}
          location={this.props.location}
          leftToolbarGroup={this.renderLeftToolbarGroup()}
        />
        {this.props.children}
        <Footer />
      </div>
    );
  }
}

export default LoggedInHandler;
