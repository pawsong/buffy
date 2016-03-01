import * as React from 'react';
import { connect } from 'react-redux';

import Toolbar = require('material-ui/lib/toolbar/toolbar');
import ToolbarGroup = require('material-ui/lib/toolbar/toolbar-group');
import RaisedButton = require('material-ui/lib/raised-button');

import Menu = require('material-ui/lib/menus/menu');
const MenuItem = require('material-ui/lib/menus/menu-item');
const IconMenu = require('material-ui/lib/menus/icon-menu');
import FlatButton = require('material-ui/lib/flat-button');
import Avatar = require('material-ui/lib/avatar');
import Tabs = require('material-ui/lib/tabs/tabs');
import Tab = require('material-ui/lib/tabs/tab');
import IconButton = require('material-ui/lib/icon-button');
import Dialog = require('material-ui/lib/dialog');
import AppBar = require('material-ui/lib/app-bar');

import * as axios from 'axios';
import * as $script from 'scriptjs';
import * as io from 'socket.io-client';

import Addon from '@pasta/core/lib/Addon';
import { AddonInst } from '@pasta/core/lib/Addon';
import StateLayer from '@pasta/core/lib/StateLayer';
import { InitParams } from '@pasta/core/lib/packet/ZC';

import { Layout, LayoutContainer } from '@pasta/components/lib/Layout';

import * as AddonLoader from '../AddonLoader';
import * as StorageKeys from '../constants/StorageKeys';
import * as ActionTypes from '../constants/ActionTypes';

import UserInfoDialog from './dialogs/UserInfoDialog';

import { NAVBAR_HEIGHT } from '../constants/Layout';

const navbarHeight = 48;

const styles = {
  profile: {
    position: 'absolute',
    top: -4,
    right: 50,
    zIndex: 1500,
  },
  content: {
    position: 'absolute',
    top: NAVBAR_HEIGHT,
    right: 0,
    bottom: 0,
    left: 0,
  },
  addon: {
    position: 'absolute',
    top: 48,
    bottom: 0,
    left: 0,
    right: 0,
  },
  fillParent: {
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

enum AddonStatus { Init, Loading, Loaded, Error };

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

interface MasterTab {
  name: string;
  url: string;
  label: string;
}

const MasterTabs: MasterTab[] = [
  { name: 'addon-voxel-editor', url: '/addons/voxel-editor', label: 'Design' },
  { name: 'addon-code-editor', url: '/addons/code-editor', label: 'Develop' },
];

const MasterTabNames = MasterTabs.map(tab => tab.name);

const MasterTabsIndexed: { [index: string]: MasterTab } = {};
MasterTabs.forEach(tab => MasterTabsIndexed[tab.name] = tab);

const MasterAddons = [
  'addon-game',
  ...MasterTabNames,
];

class Master extends React.Component<MasterProps, MasterStates> {
  static contextTypes = {
    router: React.PropTypes.object.isRequired
  }

  initialTabIndex: number;
  initialVerticalPaneSize: number;
  initialLeftHorizontalPaneSize: number;
  activeTabName: string;
  socket: SocketIOClient.Socket;
  stateLayer: StateLayer;
  addonInsts: { [index: string]: AddonInst } = {};
  promiseTokens: PromiseToken[] = [];

  constructor(props, context) {
    super(props, context);
    this.state = { disconnected: false };
    MasterAddons.forEach(addonName => this.state[addonName] = AddonStatus.Init);
  }

  componentWillMount() {
    this.activeTabName = localStorage.getItem(StorageKeys.MASTER_INITIAL_TAB) || 'addon-voxel-editor';
    this.initialTabIndex = Math.max(
      MasterTabNames.indexOf(this.activeTabName), 0
    );
    this.initialVerticalPaneSize = parseInt(localStorage.getItem(StorageKeys.MASTER_PANE_V_SIZE) || '600', 10);
    this.initialLeftHorizontalPaneSize = parseInt(localStorage.getItem(StorageKeys.MASTER_PANE_LEFT_H_SIZE) || '480', 10);
  }

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

  // Bind addons
  async loadAddon(url: string, addonName: string) {
    try {
      this.setState({ [addonName]: AddonStatus.Loading });
      const addon = await AddonLoader.load(url, `@pasta/${addonName}`);
      const element = this.refs[addonName] as HTMLElement;
      const addonInst = addon.install(element, this.stateLayer);
      this.addonInsts[addonName] = addonInst;
      this.setState({ [addonName]: AddonStatus.Loaded });
    } catch(err) {
      this.setState({ [addonName]: AddonStatus.Error });
      console.error(err);
    }
  };

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

    const tab = MasterTabs[this.initialTabIndex];
    this.loadAddon(tab.url, tab.name);
    this.loadAddon('/addons/game', 'addon-game');
  }

  // Put codes which do not need to be rendered by server.
  componentDidMount() {
    this._componentDidMount().catch(err => console.error(err));
  }

  componentWillUnmount() {
    this.promiseTokens.forEach(token => token.cancel());
    this.promiseTokens = [];

    Object.keys(this.addonInsts).forEach(key => {
      const addonInst = this.addonInsts[key];
      addonInst.destroy();
    });

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
    [AddonStatus.Init]: () => <div style={styles.overlay}>
      <div style={styles.overlayInner}>
        <div>Loading...</div>
        <div>We are working hard!</div>
      </div>
    </div>,
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
    this.activeTabName = value;
    localStorage.setItem(StorageKeys.MASTER_INITIAL_TAB, value);

    if (this.state[value] === AddonStatus.Init) {
      const tab = MasterTabsIndexed[value];
      if (tab) { this.loadAddon(tab.url, tab.name); }
    } else {
      setTimeout(() => this.onResizeAddon(value), 0);
    }
  }

  onResizeAddon(addonName) {
    const addonInst = this.addonInsts[addonName];
    if (addonInst) { addonInst.emit('resize'); }
  }

  handleRun() {
    const addonInst = this.addonInsts['addon-code-editor'];
    if (addonInst) { addonInst.emit('run'); }
  }

  onResizeVertical(size: number) {
    this.onResizeAddon('addon-game');
    localStorage.setItem(StorageKeys.MASTER_PANE_V_SIZE, '' + size);
  }

  onResizeLeftHorizontal(size: number) {
    this.onResizeAddon('addon-game');
    localStorage.setItem(StorageKeys.MASTER_PANE_LEFT_H_SIZE, '' + size);
  }

  render() {
    const user = this.props.user || {};
    const username = user.name || '';
    const picture = user.picture || '';

    const addonOverlays = {};
    MasterAddons.forEach(addonName => {
      addonOverlays[addonName] = this.getAddonStatusOverlayGen[this.state[addonName]]();
    });

    const tabs = MasterTabs.map(tab => {
      return <Tab key={tab.name} label={tab.label} value={tab.name}>
        <div ref={tab.name} style={styles.fillParent}></div>
        {addonOverlays[tab.name]}
      </Tab>;
    });

    return <div>
      <AppBar
        title="Pasta"
        zDepth={0}
        iconElementLeft={<IconButton iconClassName="material-icons">home</IconButton>}
        iconElementRight={
          <IconMenu
            desktop={true}
            iconButtonElement={<IconButton iconClassName="material-icons">expand_more</IconButton>}
            anchorOrigin={{horizontal: 'right', vertical: 'top'}}
            targetOrigin={{horizontal: 'right', vertical: 'top'}}
          >
            <MenuItem primaryText="Sign out" onTouchTap={this.onSignOut.bind(this)}/>
          </IconMenu>
        }
      />

      <div style={styles.profile}>
        <Avatar src={picture} size={30} style={{ marginTop: 11 }}/>
        <div style={{ color: 'white', float: 'right', marginTop: 18, marginLeft: 6 }}>{username}</div>
      </div>

      <Layout flow="row" style={styles.content}>
        <LayoutContainer size={this.initialVerticalPaneSize} onResize={size => this.onResizeVertical(size)}>
          <Layout flow="column" style={styles.fillParent}>
            <LayoutContainer size={this.initialLeftHorizontalPaneSize} onResize={size => this.onResizeLeftHorizontal(size)}>
              <div ref="addon-game" style={styles.game}></div>
              {addonOverlays['addon-game']}
            </LayoutContainer>
            <LayoutContainer remaining={true}>
              <Toolbar>
                <ToolbarGroup key={0} float="right">
                  <RaisedButton label="Run"
                  primary={true} onClick={this.handleRun.bind(this)}/>
                </ToolbarGroup>
              </Toolbar>
            </LayoutContainer>
          </Layout>
        </LayoutContainer>

        <LayoutContainer remaining={true} onResize={() => this.onResizeAddon(this.activeTabName)}>
          <Tabs contentContainerStyle={styles.addon}
            tabTemplate={TabTemplate}
            initialSelectedIndex={this.initialTabIndex} onChange={this.onTabChange.bind(this)}>
            {tabs}
          </Tabs>
        </LayoutContainer>
      </Layout>

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
