import * as React from 'react';
import { Dispatch } from 'redux';
import { Link } from 'react-router';
import { connect } from 'react-redux';
const FlatButton = require('material-ui/lib/flat-button');
import Colors from 'material-ui/lib/styles/colors';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import { push } from 'react-router-redux';
import Messages from '../../../constants/Messages';
import RaisedButton from 'material-ui/lib/raised-button';

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

interface LandingNavbarProps extends React.Props<LandingNavbar> {
  intl?: InjectedIntlProps;
  dispatch?: Dispatch;
}

// backgroundColor={Colors.pink100} hoverColor={Colors.pink50}

@injectIntl
@connect()
class LandingNavbar extends React.Component<LandingNavbarProps, {}> {
  render() {
    console.log(this.props);
    return (
      <Navbar>
        <ToolbarGroup float="left">
          <Link to="/"><ToolbarTitle text={this.props.intl.formatMessage(Messages.service)} style={styles.title} /></Link>
        </ToolbarGroup>
        <ToolbarGroup float="right">
          <FlatButton label={this.props.intl.formatMessage(Messages.login)}
                      style={styles.button}
                      onTouchTap={() => this.props.dispatch(push('/login'))}
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

export default LandingNavbar;
