import * as React from 'react';
import { Dispatch } from 'redux';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
const update = require('react-addons-update');
const FlatButton = require('material-ui/lib/flat-button');
import BuffyIcon from '../BuffyIcon';
import Colors from 'material-ui/lib/styles/colors';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';
import RaisedButton from 'material-ui/lib/raised-button';
import { Styles } from 'material-ui';


import Navbar from '../Navbar';

const styles = {
  title: {
    color: Colors.white,
  },
  leftButton: {
    color: Colors.white,
    marginRight: 0,
  },
  button: {
    color: Colors.white,
    marginLeft: 18,
    marginRight: 0,
  },
};

interface AnonymousNavbarProps extends React.Props<AnonymousNavbar> {
  leftToolbarGroup?: React.ReactElement<any>;
  height?: number;
  width?: number | string;
  intl?: InjectedIntlProps;
  dispatch?: Dispatch;
  location: HistoryModule.Location;
}

@connect()
@injectIntl
class AnonymousNavbar extends React.Component<AnonymousNavbarProps, {}> {
  static contextTypes = {
    muiTheme: React.PropTypes.object,
  } as any

  // the key passed through context must be called "muiTheme"
  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  } as any

  muiTheme: Styles.MuiTheme;
  toolbarHeight: number;
  logoStyle: React.CSSProperties;

  constructor(props, context) {
    super(props, context);
    const muiTheme = this.context['muiTheme'];

    this.muiTheme = this.props.height ? update(muiTheme, {
      toolbar: { height: { $set: this.props.height } },
    }) : muiTheme;

    this.muiTheme.toolbar.height

    this.logoStyle = {
      marginTop: (this.muiTheme.toolbar.height - 28) / 2,
    };
  }

  getChildContext() {
    return { muiTheme: this.muiTheme };
  }

  render() {
    const leftToolbarGroup = this.props.leftToolbarGroup || null;

    return (
      <Navbar width={this.props.width}>
        <ToolbarGroup float="left">
          <Link to="/"><BuffyIcon style={this.logoStyle} color={Colors.darkWhite} /></Link>
        </ToolbarGroup>
        {leftToolbarGroup}
        <ToolbarGroup float="right">
          <FlatButton
            label={this.props.intl.formatMessage(Messages.login)}
            style={styles.button}
            hoverColor={Colors.cyan700}
            onTouchTap={() => this.props.dispatch(push({
              pathname: '/login',
              query: {
                n: JSON.stringify({
                  p: this.props.location.pathname,
                  q: this.props.location.query,
                }),
              },
            }))}
          />
          <FlatButton label={this.props.intl.formatMessage(Messages.signup)}
                      style={styles.button}
                      onTouchTap={() => this.props.dispatch(push('/join'))}
                      backgroundColor={Colors.pinkA200}
                      hoverColor={Colors.pinkA100}
          />
        </ToolbarGroup>
      </Navbar>
    );
  }
}

export default AnonymousNavbar;
