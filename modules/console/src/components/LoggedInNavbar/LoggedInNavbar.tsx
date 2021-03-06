import * as React from 'react';
import { Link } from 'react-router';
import FlatButton from 'material-ui/FlatButton';
import BuffyIcon from '../BuffyIcon';

import * as Colors from 'material-ui/styles/colors';
import * as classNames from 'classnames';

import Avatar from 'material-ui/Avatar';
import Paper from 'material-ui/Paper';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import NavigationExpandMoreIcon from 'material-ui/svg-icons/navigation/expand-more';
import MenuItem from 'material-ui/MenuItem';
import DropDownMenu from 'material-ui/DropDownMenu';
import RaisedButton from 'material-ui/RaisedButton';
import Toolbar from 'material-ui/Toolbar/Toolbar';
import ToolbarGroup from 'material-ui/Toolbar/ToolbarGroup';
import ToolbarSeparator from 'material-ui/Toolbar/ToolbarSeparator';
import ToolbarTitle from 'material-ui/Toolbar/ToolbarTitle';

import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import Subheader from 'material-ui/Subheader';
import Divider from 'material-ui/Divider';
import LogoutIcon from 'material-ui/svg-icons/action/exit-to-app';
import ProfileIcon from 'material-ui/svg-icons/action/account-box';
import SettingsIcon from 'material-ui/svg-icons/action/settings';

import withStyles from 'isomorphic-style-loader/lib/withStyles';

const styles = require('./LoggedInNavbar.css');

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import ClickAwayListener from '../ClickAwayListener';

import {
  User,
 } from '../../reducers/users';

import Navbar from '../Navbar';

const inlineStyles = {
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
    zIndex: 1000,
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

interface LoggedInNavbarProps extends React.Props<LoggedInNavbar> {
  location: any;
  user: User;
  onLogout: () => any;
  leftToolbarGroup?: React.ReactElement<any>;
  fullWidth?: boolean;
  className?: string;
  intl?: InjectedIntlProps;
}

interface LoggedInNavbarState {
  accountInfoBoxOpened?: boolean;
}

const messages = defineMessages({
  profile: {
    id: 'navbar.accountinfo.profile',
    description: 'Your profile link label',
    defaultMessage: 'Your profile',
  },
  username: {
    id: 'navbar.accountinfo.username',
    description: 'Show username of logged in user',
    defaultMessage: 'Logged in as {username}',
  },
});

const anonProfilePicture = require('file!../../ic_pets_white_24dp_1x.png');

@injectIntl
@withStyles(styles)
class LoggedInNavbar extends React.Component<LoggedInNavbarProps, LoggedInNavbarState> {
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
    const user = this.props.user;
    const username = (user && user.username) || '';

    return (
      <div style={inlineStyles.accountInfoBox}>
        <div style={inlineStyles.accountInfoBoxCaretCont}>
          <div style={inlineStyles.accountInfoBoxOuterCaret} />
          <div style={inlineStyles.accountInfoBoxInnerCaret} />
        </div>
        <Paper zDepth={1}>
          <List>
            <Subheader>
              <FormattedMessage {...messages.username} values={{
                username: <span style={{ fontWeight: 'bold' }}>{username}</span>,
              }} />
            </Subheader>
            <ListItem primaryText={this.props.intl.formatMessage(messages.profile)}
                      leftIcon={<ProfileIcon />}
                      containerElement={<Link to={`/@${username}`}></Link>}
            />
            <ListItem primaryText={this.props.intl.formatMessage(Messages.settings)}
                      leftIcon={<SettingsIcon />}
                      containerElement={<Link to={`/settings`}></Link>}
            />
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
    const picture = user
      ? (user.picture ? `${__CDN_BASE__}/${user.picture}` : anonProfilePicture)
      : '';

    const accountInfoBox = this.state.accountInfoBoxOpened ? this.renderAccountBox() : null;

    const leftToolbarGroup = this.props.leftToolbarGroup || null;

    return (
      <Navbar fullWidth={this.props.fullWidth} className={this.props.className}>
        <ToolbarGroup>
          <Link to="/"><BuffyIcon style={inlineStyles.logo} color={Colors.darkWhite} /></Link>
          {leftToolbarGroup}
        </ToolbarGroup>
        {this.props.children}
        <ToolbarGroup>
          <a className={styles.bugReport} target="_blank" href="https://github.com/buffylab/buffy-issues">
            <IconButton tooltip="Report Issue">
              <FontIcon
                className={classNames('material-icons', styles.bugReportButton)}
              >bug_report</FontIcon>
            </IconButton>
          </a>
          <ClickAwayListener onClickAway={() => this.handleClickAway()}>
            <IconButton style={inlineStyles.avatarButton} iconStyle={inlineStyles.avatarButtonIcon} onTouchTap={() => this.handleAvatarClick()}>
              <Avatar size={32} src={picture} />
            </IconButton>
            {accountInfoBox}
          </ClickAwayListener>
        </ToolbarGroup>
      </Navbar>
    );
  }
}

export default LoggedInNavbar;
