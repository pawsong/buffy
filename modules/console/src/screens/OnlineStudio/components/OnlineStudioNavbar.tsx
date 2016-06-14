import * as React from 'react';
import FlatButton from 'material-ui/FlatButton';
import * as Colors from 'material-ui/styles/colors';
import ToolbarGroup from 'material-ui/Toolbar/ToolbarGroup';

import { User } from '../../../reducers/users';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

import LoggedInNavbar from '../../../components/LoggedInNavbar';
import AnonymousNavbar from '../../../components/AnonymousNavbar';

const styles = {
  button: {
    color: Colors.white,
    marginLeft: 25,
    marginRight: 0,
  },
};

interface OnlineStudioNavbarProps extends React.Props<OnlineStudioNavbar> {
  user: User;
  location: any;
  onSave: () => any;
  onLogout: () => any;
  onLinkClick: (location: HistoryModule.LocationDescriptor) => any;
  intl?: InjectedIntlProps;
}

@injectIntl
class OnlineStudioNavbar extends React.Component<OnlineStudioNavbarProps, void> {
  renderLeftToolbarGroup() {
    return (
      <div style={{ marginLeft: 25 }}>
        <FlatButton label={this.props.intl.formatMessage(Messages.save)}
                    style={styles.button}
                    onTouchTap={this.props.onSave}
                    backgroundColor={Colors.pinkA200}
                    hoverColor={Colors.pinkA100}
        />
        <FlatButton label={this.props.intl.formatMessage(Messages.gameMode)}
                    style={styles.button}
                    onTouchTap={() => this.props.onLinkClick('/connect/game')}
                    backgroundColor={Colors.pinkA200}
                    hoverColor={Colors.pinkA100}
        />
        <FlatButton label={this.props.intl.formatMessage(Messages.vrMode)}
                    style={styles.button}
                    onTouchTap={() => this.props.onLinkClick('/connect/vr')}
                    backgroundColor={Colors.pinkA200}
                    hoverColor={Colors.pinkA100}
        />
      </div>
    );
  }

  renderAnonymousNavbar() {
    return (
      <AnonymousNavbar location={this.props.location} fullWidth={true}
      />
    );
  }

  renderLoggedInNavbar() {
    return (
      <LoggedInNavbar location={this.props.location} fullWidth={true}
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
