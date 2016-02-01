import * as React from 'react';
import { connect } from 'react-redux';
import {
  Avatar,
  Tabs,
  Tab,
  IconButton,
} from 'material-ui';

import * as AddonLoader from '../AddonLoader';
import Addon from '@pasta/core/lib/Addon';
import StateLayer from '@pasta/core/lib/StateLayer';

import { InitParams } from '@pasta/core/lib/packet/ZC';

import Menu = require('material-ui/lib/menus/menu');
const MenuItem = require('material-ui/lib/menus/menu-item');
import IconMenu = require('material-ui/lib/menus/icon-menu');

import Dialog = require('material-ui/lib/dialog');
import FlatButton = require('material-ui/lib/flat-button');

import * as ActionTypes from '../constants/ActionTypes';
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
  logout: any;
  history: any;
}

interface PromiseToken {
  cancel: () => any,
}

class Master extends React.Component<MasterProps, {}> {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  socket: SocketIOClient.Socket;
  stateLayer: StateLayer;
  uninstalls: any[] = [];
  promiseTokens: PromiseToken[] = [];
  state = {
    disconnected: false,
  };

  exec<T>(promise: Promise<T>): Promise<T> {
    let cancelled = false;
    this.promiseTokens.push({ cancel: () => cancelled = true });

    return new Promise<T>((resolve, reject) => {
      promise.then(result => {
        if (cancelled) { return; }
        resolve(result);
      }).catch(reject);
    });
  }

  async _componentDidMount() {
    this.socket = io(CONFIG_GAME_SERVER_URL);

    this.exec(new Promise(resolve => {
      this.socket.once('disconnect', () => resolve());
    })).then(() => this.setState({ disconnected: true }));

    const params = await this.exec(new Promise<InitParams>(resolve => {
      this.socket.once('init', params => resolve(params));
    }));

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
    const loadAddon = (url: string, element: HTMLElement) => {
      return this.exec(axios.get(url) as Promise<any>).then(res => {
        new Function(res.data).call(null);
        const addon = AddonLoader.popAddon();
        const uninstall = addon.install(element, this.stateLayer);
        this.uninstalls.push(uninstall);
      });
    };

    loadAddon('/addons/code-editor', this.refs['addonCodeEditor'] as HTMLElement);
    loadAddon('/addons/voxel-editor', this.refs['addonVoxelEditor'] as HTMLElement);
    loadAddon('/addons/game', this.refs['addonGame'] as HTMLElement);
  }

  // Put codes which do not need to be rendered by server.
  componentDidMount() {
    this._componentDidMount().catch(err => console.error(err));
  }

  componentWillUnmount() {
    this.promiseTokens.forEach(token => token.cancel());
    this.promiseTokens = [];

    this.uninstalls.forEach(uninstall => uninstall());
    if (this.stateLayer) {
      this.stateLayer.destroy();
    }
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
  }

  onSignOut() {
    axios.post(`${CONFIG_AUTH_SERVER_URL}/logout`, {}, {
      withCredentials: true,
    }).then(() => {
      this.props.logout();
      this.context['router'].replace({ pathname: '/login' });
    });
  }

  render() {
    const picture = this.props.user && this.props.user.picture || '';
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
        <MenuItem primaryText="Sign out" onTouchTap={this.onSignOut.bind(this)}/>
      </IconMenu>

      <div style={styles.rightPane}>
        <div ref="addonGame" style={styles.game}></div>
      </div>

      <Dialog
        title="Disconnected"
        actions={[<FlatButton
          label="Reload"
          primary={true}
          onTouchTap={() => location.reload()}
        />]}
        modal={true}
        open={this.state.disconnected}>
        Disconnected from server. Reload browser to connect again.
      </Dialog>
    </div>;
  }
}

export default connect(
  state => ({
    user: state.auth.user
  }),
  dispatch => ({
    logout: () => dispatch({ type: ActionTypes.AUTH_LOGOUT }),
  })
)(Master);
