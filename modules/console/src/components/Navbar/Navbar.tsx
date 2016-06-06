import * as React from 'react';
import { Link } from 'react-router';
import { MuiTheme } from 'material-ui/styles';
import FlatButton from 'material-ui/FlatButton';

import * as Colors from 'material-ui/styles/colors';

import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import MenuItem from 'material-ui/MenuItem';
import DropDownMenu from 'material-ui/DropDownMenu';
import RaisedButton from 'material-ui/RaisedButton';
import Toolbar from 'material-ui/Toolbar/Toolbar';
import ToolbarGroup from 'material-ui/Toolbar/ToolbarGroup';
import ToolbarSeparator from 'material-ui/Toolbar/ToolbarSeparator';
import ToolbarTitle from 'material-ui/Toolbar/ToolbarTitle';
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

    const muiTheme: MuiTheme = context['muiTheme'];
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
