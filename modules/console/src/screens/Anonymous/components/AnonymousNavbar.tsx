import * as React from 'react';
import { Dispatch } from 'redux';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
const FlatButton = require('material-ui/lib/flat-button');
import Colors from 'material-ui/lib/styles/colors';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';
import RaisedButton from 'material-ui/lib/raised-button';

import Navbar from '../../../components/Navbar';

const styles = {
  title: {
    color: Colors.white,
  },
  leftButton: {
    float: 'right',
    color: Colors.white,
    marginLeft: 18,
    marginRight: 0,
  },
  button: {
    // color: Colors.amber50,
    color: Colors.white,
    marginLeft: 18,
    marginRight: 0,
  },
};

interface AnonymousNavbarProps extends React.Props<AnonymousNavbar> {
  intl?: InjectedIntlProps;
  dispatch?: Dispatch;
  location: HistoryModule.Location;
}

const messages = defineMessages({
  featuresLabel: {
    id: 'anon.navbar.features',
    description: 'Simple question to ask why this service is good',
    defaultMessage: 'Why?',
  },
});

@injectIntl
@connect()
class AnonymousNavbar extends React.Component<AnonymousNavbarProps, {}> {
  render() {
    return (
      <Navbar>
        <ToolbarGroup float="left">
          <Link to="/"><ToolbarTitle text={this.props.intl.formatMessage(Messages.service)} style={styles.title} /></Link>
          <FlatButton label={this.props.intl.formatMessage(messages.featuresLabel)}
                      style={styles.leftButton}
                      onTouchTap={() => this.props.dispatch(push({ pathname: '/features' }))}
          />
        </ToolbarGroup>
        <ToolbarGroup float="right">
          <FlatButton label={this.props.intl.formatMessage(Messages.login)}
                      style={styles.button}
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
