import * as React from 'react';
import { Dispatch } from 'redux';
import { Link } from 'react-router';
import { connect } from 'react-redux';
import { push } from 'react-router-redux';
const update = require('react-addons-update');
const FlatButton = require('material-ui/lib/flat-button');
import ActionPets from 'material-ui/lib/svg-icons/action/pets';
import Colors from 'material-ui/lib/styles/colors';
import Toolbar from 'material-ui/lib/toolbar/toolbar';
import ToolbarGroup from 'material-ui/lib/toolbar/toolbar-group';
import ToolbarTitle from 'material-ui/lib/toolbar/toolbar-title';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../constants/Messages';
import RaisedButton from 'material-ui/lib/raised-button';
import FontIcon from 'material-ui/lib/font-icon';
import Tabs from 'material-ui/lib/tabs/tabs';
import Tab from 'material-ui/lib/tabs/tab';
import { Styles } from 'material-ui';


import Navbar from '../../../components/Navbar';

const styles = {
  title: {
    color: Colors.white,
  },
  logo: {
    marginTop: 22,
  },
  leftButton: {
    // float: 'right',
    color: Colors.white,
    // marginLeft: 18,
    marginRight: 0,
  },
  button: {
    // color: Colors.amber50,
    color: Colors.white,
    marginLeft: 18,
    marginRight: 0,
  },
};

const messages = defineMessages({
  featuresLabel: {
    id: 'anon.navbar.features',
    description: 'Simple question to ask why this service is good',
    defaultMessage: 'Why?',
  },
  featuresForTeachersLabel: {
    id: 'anon.navbar.featuresForTeachers',
    description: 'Features for teachers page link button label',
    defaultMessage: 'Teachers',
  },
  gettingStarted: {
    id: 'anon.navbar.gettingStarted',
    description: 'Label for getting started button',
    defaultMessage: 'Getting Started',
  },
});

interface AnonymousNavbarProps extends React.Props<AnonymousNavbar> {
  intl?: InjectedIntlProps;
  dispatch?: Dispatch;
  location: HistoryModule.Location;
}

interface AnonymousNavbarState {
  muiTheme: Styles.MuiTheme;
}

@injectIntl
@connect()
class AnonymousNavbar extends React.Component<AnonymousNavbarProps, AnonymousNavbarState> {
  static contextTypes = {
    muiTheme: React.PropTypes.object,
  } as any

  //the key passed through context must be called "muiTheme"
  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  } as any

  toolbarHeight: number;

  constructor(props, context) {
    super(props, context);
    this.state = {
      muiTheme: this.context['muiTheme'],
    };
  }

  getChildContext() {
    return {
      muiTheme: this.state.muiTheme,
    };
  }

  componentWillMount () {
    this.setState({
      muiTheme: update(this.state.muiTheme, {
        toolbar: { height: { $set: 72 } },
      }),
    });
  }

  handleTabChange(value) {
    this.props.dispatch(push(value));
  }

  render() {
    console.log(this.props.location);
    return (
      <Navbar>
        <ToolbarGroup float="left" style={{ marginRight: 30 }}>
          <Link to="/"><ActionPets style={styles.logo} color={Colors.darkWhite} /></Link>
        </ToolbarGroup>
        <ToolbarGroup float="left">
          <Tabs value={this.props.location.pathname}
                onChange={value => this.handleTabChange(value)}
                style={{ width: 300 }}
          >
            <Tab value="/features"
              icon={<FontIcon className="material-icons">playlist_add_check</FontIcon>}
              label={this.props.intl.formatMessage(messages.featuresLabel)}
            />
            <Tab value="/features/teachers"
              icon={<FontIcon className="material-icons">tag_faces</FontIcon>}
              label={this.props.intl.formatMessage(messages.featuresForTeachersLabel)}
            />
            <Tab value="/getting-started"
              icon={<FontIcon className="material-icons">play_arrow</FontIcon>}
              label={this.props.intl.formatMessage(messages.gettingStarted)}
            />
          </Tabs>
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
