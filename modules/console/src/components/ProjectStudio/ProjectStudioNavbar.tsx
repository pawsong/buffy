import * as React from 'react';
import FlatButton from 'material-ui/lib/flat-button';
import Colors from 'material-ui/lib/styles/colors';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';

import { User } from '../../reducers/users';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import LoggedInNavbar from '../LoggedInNavbar';
import AnonymousNavbar from '../AnonymousNavbar';

const styles = {
  button: {
    color: Colors.white,
    marginLeft: 50,
    marginRight: 0,
  },
};

interface ProjectStudioNavbarProps extends React.Props<ProjectStudioNavbar> {
  user: User;
  location: any;
  onLogout: () => any;
  onSave: () => any;
  onLinkClick: (location: HistoryModule.LocationDescriptor) => any;
  intl?: InjectedIntlProps;
}

@injectIntl
class ProjectStudioNavbar extends React.Component<ProjectStudioNavbarProps, void> {
  renderLeftToolbarGroup() {
    return (
      <ToolbarGroup float="left">
        <FlatButton label={this.props.intl.formatMessage(Messages.save)}
                    style={styles.button}
                    onTouchTap={() => this.props.onSave()}
                    backgroundColor={Colors.pinkA200}
                    hoverColor={Colors.pinkA100}
        />
      </ToolbarGroup>
    );
  }

  renderAnonymousNavbar() {
    return (
      <AnonymousNavbar location={this.props.location} width="100%"
                       leftToolbarGroup={this.renderLeftToolbarGroup()}
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

export default ProjectStudioNavbar;
