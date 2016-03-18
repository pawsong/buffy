import * as React from 'react';
import { Link } from 'react-router';
import { Styles } from 'material-ui';
import AppBar from 'material-ui/lib/app-bar';
const FlatButton = require('material-ui/lib/flat-button');
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

class JoinNavbar extends React.Component<{}, {}> {
  render() {
    return (
      <Navbar>
        <ToolbarGroup float="left">
          <Link to="/"><ToolbarTitle text="PASTA" style={styles.title} /></Link>
        </ToolbarGroup>
        <ToolbarGroup float="right">
          <FlatButton label="Log in"
                      linkButton={true}
                      containerElement={<Link to="/login" />}
                      style={styles.button}
          />
        </ToolbarGroup>
      </Navbar>
    );
  }
}

export default JoinNavbar;
