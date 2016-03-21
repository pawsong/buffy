import * as React from 'react';
import { Link } from 'react-router';
import { Styles } from 'material-ui';
import AppBar from 'material-ui/lib/app-bar';
import FlatButton from 'material-ui/lib/flat-button';
import ActionPets from 'material-ui/lib/svg-icons/action/pets';

import Colors from 'material-ui/lib/styles/colors';

import Avatar from 'material-ui/lib/avatar';
import Paper from 'material-ui/lib/paper';
import IconMenu from 'material-ui/lib/menus/icon-menu';
import IconButton from 'material-ui/lib/icon-button';
import FontIcon from 'material-ui/lib/font-icon';
import NavigationExpandMoreIcon from 'material-ui/lib/svg-icons/navigation/expand-more';
import MenuItem from 'material-ui/lib/menus/menu-item';
import DropDownMenu from 'material-ui/lib/DropDownMenu';
import RaisedButton from 'material-ui/lib/raised-button';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarSeparator from 'material-ui/lib/toolbar/toolbar-separator';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';

import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import LogoutIcon from 'material-ui/lib/svg-icons/action/exit-to-app';

const objectAssign = require('object-assign');

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';

import ClickAwayListener from '../../../components/ClickAwayListener';

import {
  User,
 } from '../../../reducers/users';

import Navbar from '../../../components/Navbar';

interface AppNavbarProps extends React.Props<AppNavbar> {
  location: any;
  user: User;
  onLogout: () => any;
  intl?: InjectedIntlProps;
}

interface AppNavbarState {
  accountInfoBoxOpened?: boolean;
}

@injectIntl
class AppNavbar extends React.Component<AppNavbarProps, AppNavbarState> {
  constructor(props, context) {
    super(props, context);
    this.state = {
      accountInfoBoxOpened: false,
    };
  }

  handleLogout() {
    this.props.onLogout();
  }

  handleAvatarClick() {
    this.setState({ accountInfoBoxOpened: !this.state.accountInfoBoxOpened });
  }

  closeAccountInfoBox() {
    if (this.state.accountInfoBoxOpened) this.setState({ accountInfoBoxOpened: false });
  }

  handleClickAway() {
    this.closeAccountInfoBox();
  }

  componentDidUpdate(prevProps) {
    if (this.props.location !== prevProps.location) this.closeAccountInfoBox();
  }

  renderAccountBox() {
    return (
      <div style={styles.accountInfoBox}>
        <div style={styles.accountInfoBoxCaretCont}>
          <div style={styles.accountInfoBoxOuterCaret} />
          <div style={styles.accountInfoBoxInnerCaret} />
        </div>
        <Paper zDepth={1}>
          <List>
            <ListItem primaryText={this.props.intl.formatMessage(Messages.logout)}
                      leftIcon={<LogoutIcon />}
                      onTouchTap={() => this.handleLogout()}
            />
          </List>
        </Paper>
      </div>
    );
  }

  render() {
    const user = this.props.user;
    const picture = user ? user.picture : '';

    const accountInfoBox = this.state.accountInfoBoxOpened ? this.renderAccountBox() : null;

    return (
      <Navbar>
        <ToolbarGroup float="left">
          <Link to="/"><ActionPets style={styles.logo} /></Link>
        </ToolbarGroup>
        <ToolbarGroup float="right">
          <ClickAwayListener onClickAway={() => this.handleClickAway()}>
            <IconButton style={styles.avatarButton} iconStyle={styles.avatarButtonIcon} onTouchTap={() => this.handleAvatarClick()}>
              <Avatar size={32} src={picture} />
            </IconButton>
            {accountInfoBox}
          </ClickAwayListener>
        </ToolbarGroup>
      </Navbar>
    );
  }
}

export default AppNavbar;

const styles = {
  title: {
    color: Colors.white,
  },
  logo: {
    marginTop: 16,
  },
  avatarButton: {
    margin: '4px -8px 4px 0',
  },
  avatarButtonIcon: {
    margin: '-8px 0 -8px -4px',
  },
  accountInfoBox: {
    position: 'absolute',
    right: 0,
    width: 200,
  },
  accountInfoBoxCaretCont: {
    position: 'absolute',
    top: -10,
    left: 'auto',
    right: 8,
    width: 18,
    height: 10,
    float: 'left',
    overflow: 'hidden',
  },
  accountInfoBoxOuterCaret: {
    position: 'absolute',
    top: 0,
    left: 0,
    display: 'inline-block',
    marginLeft: -1,
    borderBottom: '10px solid #8899a6',
    borderBottomColor: 'rgba(0,0,0,0.1)',
    borderLeft: '10px solid transparent',
    borderRight: '10px solid transparent',
    height: 'auto',
    width: 'auto',
  },
  accountInfoBoxInnerCaret: {
    position: 'absolute',
    display: 'inline-block',
    marginLeft: -1,
    top: 1,
    left: 1,
    borderLeft: '9px solid transparent',
    borderRight: '9px solid transparent',
    borderBottom: '9px solid #fff',
    borderBottomColor: 'rgba(255,255,255,0.98)',
  },
};
