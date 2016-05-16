import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { push } from 'react-router-redux';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
const FlatButton = require('material-ui/lib/flat-button');
import Colors from 'material-ui/lib/styles/colors';

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
  renderLeftToolbarGroup() {
    return (
      <ToolbarGroup float="left" style={{ marginLeft: 25 }}>
        <FlatButton label={this.props.intl.formatMessage(Messages.create)}
                    style={styles.button}
                    onTouchTap={() => this.props.push('/create')}
                    backgroundColor={Colors.pinkA200}
                    hoverColor={Colors.pinkA100}
        />
        <FlatButton label={this.props.intl.formatMessage(Messages.explore)}
                    style={styles.button}
                    onTouchTap={() => this.props.push('/explore')}
                    backgroundColor={Colors.pinkA200}
                    hoverColor={Colors.pinkA100}
        />
      </ToolbarGroup>
    );
  }

  render() {
    return (
      <div>
        <LoggedInNavbar user={this.props.user}
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
