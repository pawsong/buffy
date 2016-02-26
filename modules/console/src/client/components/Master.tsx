import * as React from 'react';
import { connect } from 'react-redux';

import Menu = require('material-ui/lib/menus/menu');
const MenuItem = require('material-ui/lib/menus/menu-item');
import IconMenu = require('material-ui/lib/menus/icon-menu');
import FlatButton = require('material-ui/lib/flat-button');
import Avatar = require('material-ui/lib/avatar');
import Tabs = require('material-ui/lib/tabs/tabs');
import Tab = require('material-ui/lib/tabs/tab');
import IconButton = require('material-ui/lib/icon-button');
import Dialog = require('material-ui/lib/dialog');

import * as axios from 'axios';
import * as $script from 'scriptjs';
import * as io from 'socket.io-client';

import Addon from '@pasta/core/lib/Addon';
import StateLayer from '@pasta/core/lib/StateLayer';
import { InitParams } from '@pasta/core/lib/packet/ZC';

import * as AddonLoader from '../AddonLoader';
import * as StorageKeys from '../constants/StorageKeys';
import * as ActionTypes from '../constants/ActionTypes';

import UserInfoDialog from './dialogs/UserInfoDialog';

const navbarHeight = 48;

const styles = {
  tabs: {
    width: 400,
    marginLeft: 48,
  },
  nameContainer: {
    position: 'absolute',
    color: 'white',
    top: 17,
    right: 58,
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
  overlay: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
  },
  overlayInner: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
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

interface PromiseToken {
  cancel: () => any,
}

enum AddonStatus { Loading, Loaded, Error };

interface MasterProps extends React.Props<Master> {
  user: any;
  logout: any;
  history: any;
}

interface MasterStates {
  disconnected?: boolean;
  addonCodeEditor?: AddonStatus;
  addonVoxelEditor?: AddonStatus;
  addonGame?: AddonStatus;
}

class Master extends React.Component<MasterProps, MasterStates> {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  initialTabIndex: number;
  socket: SocketIOClient.Socket;
  stateLayer: StateLayer;
  uninstalls: any[] = [];
  promiseTokens: PromiseToken[] = [];

  Addons = [
    'addon-voxel-editor',
    'addon-code-editor',
    'addon-game',
  ];

  constructor(props, context) {
    super(props, context);
    this.state.disconnected = false;
    this.Addons.forEach(addonName => this.state[addonName] = AddonStatus.Loading);
    this.initialTabIndex =
      parseInt(localStorage.getItem(StorageKeys.MASTER_INITIAL_TAB), 10) || 0;
  }

  state = {
    disconnected: false,
    addonCodeEditor: AddonStatus.Loading,
    addonVoxelEditor: AddonStatus.Loading,
    addonGame: AddonStatus.Loading,
  };

  exec<T>(promise: Promise<T>): Promise<T> {
    let cancelled = false;
    this.promiseTokens.push({ cancel: () => cancelled = true });

    return new Promise<T>((resolve, reject) => {
      promise.then(result => {
        if (cancelled) { return; }
        resolve(result);
      }).catch(err => {
        if (cancelled) { return; }
        reject(err);
      });
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
    const loadAddon = async (url: string, addonName: string) => {
      try {
        const addon = await AddonLoader.load(url, `@pasta/${addonName}`);
        const element = this.refs[addonName] as HTMLElement;
        const uninstall = addon.install(element, this.stateLayer);
        this.uninstalls.push(uninstall);
        this.setState({ [addonName]: AddonStatus.Loaded });
      } catch(err) {
        this.setState({ [addonName]: AddonStatus.Error });
        console.error(err);
      }
    };

    loadAddon('/addons/code-editor', 'addon-code-editor');
    loadAddon('/addons/voxel-editor', 'addon-voxel-editor');
    loadAddon('/addons/game', 'addon-game');
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

  getAddonStatusOverlayGen = {
    [AddonStatus.Loading]: () => <div style={styles.overlay}>
      <div style={styles.overlayInner}>
        <div>Loading...</div>
        <div>We are working hard!</div>
      </div>
    </div>,
    [AddonStatus.Error]: () => <div style={styles.overlay}>
      <div style={styles.overlayInner}>
        <div>Something went wrong</div>
        <div>So Sad...</div>
      </div>
    </div>,
    [AddonStatus.Loaded]: () => null,
  };

  onTabChange(value) {
    localStorage.setItem(StorageKeys.MASTER_INITIAL_TAB, value);
  }

  // Rerender addon screen
  forceUpdate() {
    setTimeout(() => window.dispatchEvent(new Event('resize')), 0);
  }

  render() {
    const user = this.props.user || {};
    const username = user.name || '';
    const picture = user.picture || '';

    const addonOverlays = {};
    this.Addons.forEach(addonName => {
      addonOverlays[addonName] = this.getAddonStatusOverlayGen[this.state[addonName]]();
    });

    return <div style={{ backgroundColor: '#00bcd4'}}>
      <IconButton iconClassName="material-icons" style={{position: 'absolute' }}>
        home
      </IconButton>

      <Tabs style={styles.tabs} contentContainerStyle={styles.leftPane}
        tabTemplate={TabTemplate}
        initialSelectedIndex={this.initialTabIndex} onChange={this.onTabChange.bind(this)}>
        <Tab label="Design" value="0" onActive={this.forceUpdate}>
          <div ref="addon-voxel-editor" style={styles.addon}></div>
          {addonOverlays['addon-voxel-editor']}
        </Tab>
        <Tab label="Develop" value="1" onActive={this.forceUpdate}>
          <div ref="addon-code-editor" style={styles.addon}></div>
          {addonOverlays['addon-code-editor']}
        </Tab>
      </Tabs>

      <div style={styles.nameContainer}>{username}</div>

      <IconMenu style={styles.avatarContainer} desktop={true} iconButtonElement={
        <Avatar style={styles.avatar} src={picture}/>
        }>
        <MenuItem primaryText="Sign out" onTouchTap={this.onSignOut.bind(this)}/>
      </IconMenu>

      <div style={styles.rightPane}>
        <div ref="addon-game" style={styles.game}></div>
        {addonOverlays['addon-game']}
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
      <UserInfoDialog/>
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
