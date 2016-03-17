import * as React from 'react';
import { Link } from 'react-router';
import { Styles } from 'material-ui';
import AppBar = require('material-ui/lib/app-bar');
const FlatButton = require('material-ui/lib/flat-button');

import Colors = require('material-ui/lib/styles/colors');

import Avatar = require('material-ui/lib/avatar');
const Paper = require('material-ui/lib/paper');
import IconMenu = require('material-ui/lib/menus/icon-menu');
import IconButton = require('material-ui/lib/icon-button');
import FontIcon = require('material-ui/lib/font-icon');
const NavigationExpandMoreIcon = require('material-ui/lib/svg-icons/navigation/expand-more');
import MenuItem = require('material-ui/lib/menus/menu-item');
const DropDownMenu = require('material-ui/lib/DropDownMenu');
const RaisedButton = require('material-ui/lib/raised-button');
import Toolbar = require('material-ui/lib/toolbar/toolbar');
import ToolbarGroup = require('material-ui/lib/toolbar/toolbar-group');
import ToolbarSeparator = require('material-ui/lib/toolbar/toolbar-separator');
import ToolbarTitle = require('material-ui/lib/toolbar/toolbar-title');

import List = require('material-ui/lib/lists/list');
const ListItem = require('material-ui/lib/lists/list-item');
const LogoutIcon = require('material-ui/lib/svg-icons/action/exit-to-app');

import objectAssign = require('object-assign');

import {
  User,
 } from '../../../reducers/users';

import Navbar from '../../../components/Navbar';

interface AppNavbarProps extends React.Props<AppNavbar> {
  user: User;
  onLogout: () => any;
}

interface AppNavbarState {
  accountInfoBoxOpened?: boolean;
}

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

  render() {
    const user = this.props.user;
    const picture = user ? user.picture : '';

    const accountInfoBox = !this.state.accountInfoBoxOpened ? null : (
      <div style={styles.accountInfoBox}>
        <div style={styles.accountInfoBoxCaretCont}>
          <div style={styles.accountInfoBoxOuterCaret} />
          <div style={styles.accountInfoBoxInnerCaret} />
        </div>
        <Paper zDepth={1}>
          <List>
            <ListItem primaryText="Log out" leftIcon={<LogoutIcon />} onTouchTap={() => this.handleLogout()} />
          </List>
        </Paper>
      </div>
    );

    return (
      <Navbar>
        <ToolbarGroup float="left">
          <Link to="/"><ToolbarTitle text="PASTA" style={styles.title} /></Link>
        </ToolbarGroup>
        <ToolbarGroup float="right">
          <IconButton style={styles.avatarButton} iconStyle={styles.avatarButtonIcon} onTouchTap={() => this.handleAvatarClick()}>
            <Avatar size={32} src={picture} />
          </IconButton>
          {accountInfoBox}
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
  button: {
    // color: Colors.amber50,
    // color: Colors.white,
    // marginLeft: 18,
    // marginRight: 0,
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
