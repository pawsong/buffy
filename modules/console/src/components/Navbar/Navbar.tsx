import * as React from 'react';
import { Link } from 'react-router';
import { Styles } from 'material-ui';
import AppBar from 'material-ui/lib/app-bar';
import FlatButton from 'material-ui/lib/flat-button';

import Colors from 'material-ui/lib/styles/colors';

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
import withStyles from 'isomorphic-style-loader/lib/withStyles';

import Wrapper from '../Wrapper';
const styles = require('./Navbar.css');

interface NavbarProps extends React.Props<Navbar> {
  width?: number | string;
}

@withStyles(styles)
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
        <div className={styles.content}>
          <Wrapper backgroundColor={this.backgroundColor} width={this.props.width}>
            <Toolbar style={this.toolbarStyle}>{this.props.children}</Toolbar>
          </Wrapper>
        </div>
        <div style={this.paddingStyle}/>
      </div>
    );
  }
}

export default Navbar;
