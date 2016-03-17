import * as React from 'react';
import { Link } from 'react-router';
import { Styles } from 'material-ui';
import AppBar = require('material-ui/lib/app-bar');
const FlatButton = require('material-ui/lib/flat-button');

import Colors = require('material-ui/lib/styles/colors');

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

import Wrapper from './Wrapper';

const styles = {
  content: {
    position: 'fixed',
    width: '100%',
    zIndex: 1000,
  },
};

interface NavbarProps extends React.Props<Navbar> {}

class Navbar extends React.Component<NavbarProps, {}> {
  static contextTypes = {
    muiTheme: React.PropTypes.object,
  }

  backgroundColor: string;
  toolbarStyle: Object;
  paddingStyle: Object;

  constructor(props, context) {
    super(props, context);

    const muiTheme: Styles.MuiTheme = context['muiTheme'];
    this.backgroundColor = muiTheme.rawTheme.palette.primary1Color;
    this.toolbarStyle = { backgroundColor: this.backgroundColor };
    this.paddingStyle = { height: muiTheme.toolbar.height };
  }

  render() {
    return (
      <div>
        <div style={styles.content}>
          <Wrapper backgroundColor={this.backgroundColor}>
            <Toolbar style={this.toolbarStyle}>{this.props.children}</Toolbar>
          </Wrapper>
        </div>
        <div style={this.paddingStyle}/>
      </div>
    );
  }
}

export default Navbar;
