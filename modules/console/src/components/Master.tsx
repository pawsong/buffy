import * as React from 'react';
import { connect } from 'react-redux';
import {
  Avatar,
  Tabs,
  Tab,
  IconButton,
} from 'material-ui';

import Addon from '@pasta/addon/lib/Addon';
import StateLayer from '@pasta/addon/lib/StateLayer';

import Menu = require('material-ui/lib/menus/menu');
import MenuItem = require('material-ui/lib/menus/menu-item');
import IconMenu = require('material-ui/lib/menus/icon-menu');

import {
  SET_USER_DATA,
} from '../constants/ActionTypes';
import * as axios from 'axios';

import * as io from 'socket.io-client';

const navbarHeight = 48;

const styles = {
  tabs: {
    width: 400,
    marginLeft: 48,
  },
  avatarContainer: {
    position: 'absolute',
    top: -4,
    right: 5,
  },
  avatar: {
    cursor: 'pointer',
    marginTop: 8,
  },
  content: {
    position: 'absolute',
    top: navbarHeight,
    right: 0,
    bottom: 0,
    left: 0,
  },
  leftPane: {
    position: 'absolute',
    top: navbarHeight,
    bottom: 0,
    left: 0,
    right: '50%',
  },
  rightPane: {
    position: 'absolute',
    top: navbarHeight,
    bottom: 0,
    left: '50%',
    right: 0,
    backgroundColor: 'rgb(232,232,232)',
  },
  addon: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  game: {
    margin: 'auto',
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
};

interface TabTemplateProps extends React.Props<TabTemplate> {
  selected: boolean;
}

class TabTemplate extends React.Component<TabTemplateProps, {}> {
  render() {
    let styles: {
      width: string;
      height: string;
      display?: string;
    } = {
      'width': '100%',
      'height': '100%',
    };

    if (!this.props.selected) {
      styles.display = 'none';
    }

    return (
      <div style={styles}>
        {this.props.children}
      </div>
    );
  }
};

interface MasterProps extends React.Props<Master> {
  user: any;
  setUser: any;
  history: any;
}

class Master extends React.Component<MasterProps, {}> {
  socket: SocketIOClient.Socket;
  stateLayer: StateLayer;
  uninstalls: any[] = [];
  mounted = false;

  // Put codes which do not need to be rendered by server.
  componentDidMount() {
    this.mounted = true;

    this.socket = io(CONFIG_GAME_SERVER_URL);

    this.socket.once('init', params => {
      // Cancel
      if (!this.mounted) { return; }

      this.stateLayer = new StateLayer({
        emit: (event, params, cb) => {
          this.socket.emit(event, params, cb);
        },
        listen: (event, handler) => {
          this.socket.addEventListener(event, handler);
          return () => this.socket.removeEventListener(event, handler);
        },
        update: (callback) => {
          let frameId = requestAnimationFrame(update);
          let then = Date.now();
          function update() {
            const now = Date.now();
            callback(now - then);
            then = now;
            frameId = requestAnimationFrame(update);
          }
          return () => cancelAnimationFrame(frameId);
        },
      }, params);

      // Bind addons
      const addons: Addon[] = [];
      Object.defineProperty(window, '__ADDON_REGISTER__', {
        enumerable: false,
        configurable: false,
        writable: false,
        value: (addon: Addon) => {
          addons.push(addon);
        },
      });

      const loadAddon = (url: string, element: HTMLElement) => {
        axios.get(url).then(res => {
          // Cancel
          if (!this.mounted) { return; }

          // Eval
          const source = res.data;
          addons.length = 0;
          new Function(source).call(null);

          // Load
          const addon = addons[0];
          const uninstall = addon.install(element, this.stateLayer);
          this.uninstalls.push(uninstall);
        });
      }

      loadAddon('/addons/code-editor', this.refs['addonCodeEditor'] as HTMLElement);
      loadAddon('/addons/voxel-editor', this.refs['addonVoxelEditor'] as HTMLElement);
      loadAddon('/addons/game', this.refs['addonGame'] as HTMLElement);
    });
  }

  componentWillUnmount() {
    this.mounted = false;
    this.uninstalls.forEach(uninstall => uninstall());
    this.stateLayer.destroy();
    this.socket.disconnect();
  }

  onSignOut() {
    axios.post(`${CONFIG_AUTH_SERVER_URL}/logout`, {}, {
      withCredentials: true,
    }).then(() => {
      this.props.setUser(null);
      this.props.history.pushState(null, '/login', {});
    });
  }

  render() {
    const picture = this.props.user ? this.props.user.picture : '';

    return <div style={{ backgroundColor: '#00bcd4'}}>
      <IconButton iconClassName="material-icons" style={{position: 'absolute' }}>
        home
      </IconButton>

      <Tabs style={styles.tabs} contentContainerStyle={styles.leftPane}
        tabTemplate={TabTemplate}>
        <Tab label="Design">
          <div ref="addonVoxelEditor" style={styles.addon}></div>
        </Tab>
        <Tab label="Develop">
          <div ref="addonCodeEditor" style={styles.addon}></div>
        </Tab>
      </Tabs>

      <IconMenu style={styles.avatarContainer} desktop={true} iconButtonElement={
        <Avatar style={styles.avatar} src={picture}/>
        }>
        <MenuItem primaryText="Sign out" onClick={this.onSignOut.bind(this)}/>
      </IconMenu>

      <div style={styles.rightPane}>
        <div ref="addonGame" style={styles.game}></div>
      </div>
    </div>;
  }
}

export default connect(
  state => ({
    user: state.user
  }),
  dispatch => ({
    setUser: user => dispatch({ type: SET_USER_DATA, user }),
  })
)(Master);
