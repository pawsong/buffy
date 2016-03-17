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

const ActionHome = require('material-ui/lib/svg-icons/action/home');

import Navbar from '../../../components/Navbar';

const styles = {
  title: {
    color: Colors.white,
  },
  button: {
    // color: Colors.amber50,
    color: Colors.white,
    marginLeft: 18,
    marginRight: 0,
  },
};

class LoginNavbar extends React.Component<{}, {}> {
  render() {
    return (
      <Navbar>
        <ToolbarGroup float="left">
          <Link to="/"><ToolbarTitle text="PASTA" style={styles.title} /></Link>
        </ToolbarGroup>
        <ToolbarGroup float="right">
          <FlatButton label="Sign up"
                      linkButton={true}
                      containerElement={<Link to="/join" />}
                      backgroundColor={Colors.pink100} hoverColor={Colors.pink50} style={styles.button}
          />
        </ToolbarGroup>
      </Navbar>
    );
  }
}

export default LoginNavbar;
