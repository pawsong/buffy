import * as React from 'react';
import FlatButton from 'material-ui/lib/flat-button';
import Colors from 'material-ui/lib/styles/colors';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';

import { User } from '../../../reducers/users';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

import LoggedInNavbar from '../../../components/LoggedInNavbar';
import AnonymousNavbar from '../../../components/AnonymousNavbar';

const styles = {
  button: {
    color: Colors.white,
    marginLeft: 50,
    marginRight: 0,
  },
};

interface OnlineStudioNavbarProps extends React.Props<OnlineStudioNavbar> {
  user: User;
  location: any;
  onLogout: () => any;
  onLinkClick: (location: HistoryModule.LocationDescriptor) => any;
  intl?: InjectedIntlProps;
}

@injectIntl
class OnlineStudioNavbar extends React.Component<OnlineStudioNavbarProps, void> {
  renderLeftToolbarGroup() {
    return (
      <ToolbarGroup float="left">
        <FlatButton label={this.props.intl.formatMessage(Messages.vrMode)}
                    style={styles.button}
                    onTouchTap={() => this.props.onLinkClick('/connect/vr')}
                    backgroundColor={Colors.pinkA200}
                    hoverColor={Colors.pinkA100}
        />
      </ToolbarGroup>
    );
  }

  renderAnonymousNavbar() {
    return (
      <AnonymousNavbar location={this.props.location} width="100%"
      />
    );
  }

  renderLoggedInNavbar() {
    return (
      <LoggedInNavbar location={this.props.location} width="100%"
                      leftToolbarGroup={this.renderLeftToolbarGroup()}
                      user={this.props.user}
                      onLogout={this.props.onLogout}
      />
    );
  }

  render() {
    return this.props.user ? this.renderLoggedInNavbar() : this.renderAnonymousNavbar();
  }
}

export default OnlineStudioNavbar;
