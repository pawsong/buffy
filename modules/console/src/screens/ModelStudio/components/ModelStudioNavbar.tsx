import * as React from 'react';
import FlatButton from 'material-ui/FlatButton';
import * as Colors from 'material-ui/styles/colors';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';

import { User } from '../../../reducers/users';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

import LoggedInNavbar from '../../../components/LoggedInNavbar';
import AnonymousNavbar from '../../../components/AnonymousNavbar';

const messages = defineMessages({
  newFile: {
    id: 'modelstudio.navbar.new.file',
    description: 'New file',
    defaultMessage: 'New file',
  },
});

const styles = {
  button: {
    color: Colors.white,
    // marginLeft: 25,
    // marginRight: 25,
  },
};

interface ModelStudioNavbarProps extends React.Props<ModelStudioNavbar> {
  user: User;
  location: any;
  onNewFile: () => any;
  onRequestOpenFile: () => any;
  onSave: () => any;
  onLogout: () => any;
  onLinkClick: (location: HistoryModule.LocationDescriptor) => any;
  intl?: InjectedIntlProps;
}

@injectIntl
class ModelStudioNavbar extends React.Component<ModelStudioNavbarProps, void> {
  renderLeftToolbarGroup() {
    return (
      <div style={{ marginLeft: 25, marginTop: 10 }}>
        <div style={{ display: 'inline-block', marginRight: 10 }}>
          <FlatButton
            label={this.props.intl.formatMessage(messages.newFile)}
            style={styles.button}
            onTouchTap={this.props.onNewFile}
            hoverColor={Colors.cyan700}
          />
        </div>
        <div style={{ display: 'inline-block', marginRight: 10 }}>
          <FlatButton
            label={this.props.intl.formatMessage(Messages.open)}
            style={styles.button}
            onTouchTap={this.props.onRequestOpenFile}
            hoverColor={Colors.cyan700}
          />
        </div>
        <div style={{ display: 'inline-block' }}>
          <FlatButton
            label={this.props.intl.formatMessage(Messages.save)}
            style={styles.button}
            onTouchTap={this.props.onSave}
            hoverColor={Colors.cyan700}
          />
        </div>
      </div>
    );
  }

  renderAnonymousNavbar() {
    return (
      <AnonymousNavbar
        location={this.props.location}
        width="100%"
        leftToolbarGroup={this.renderLeftToolbarGroup()}
      />
    );
  }

  renderLoggedInNavbar() {
    return (
      <LoggedInNavbar
        location={this.props.location}
        width="100%"
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

export default ModelStudioNavbar;
