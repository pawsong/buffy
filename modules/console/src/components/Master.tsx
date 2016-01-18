import * as React from 'react';
import { connect } from 'react-redux';
import {
  Avatar,
  Toolbar,
  ToolbarGroup,
  ToolbarTitle,
  RaisedButton,
  Tabs,
  Tab,
  IconButton,
} from 'material-ui';

import * as MaterialUI from 'material-ui';

const Menu: typeof __MaterialUI.Menus.Menu = require('material-ui/lib/menus/menu');
const MenuItem: typeof __MaterialUI.Menus.MenuItem = require('material-ui/lib/menus/menu-item');
const IconMenu: typeof __MaterialUI.Menus.IconMenu = require('material-ui/lib/menus/icon-menu');

import {
  SET_USER_DATA,
} from '../constants/ActionTypes';
import * as axios from 'axios';

import * as io from 'socket.io-client';

import {
  Protocol,
  createAdapter,
} from '@pasta/game-api';

import GameObject from '@pasta/game-class/lib/GameObject';
import GameStore from '@pasta/game-class/lib/GameStore';

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
  editor: AceAjax.Editor;
  _socket: SocketIOClient.Socket;
  codeStore: GameStore;
  addons: any[] = [];
  frameId;

  createAdapter(socket) {
    return createAdapter({
      [Protocol.IO]: (apiName, payload) => {
        return new Promise((resolve, reject) => {
          socket.emit(apiName, payload, msg => {
            if (msg.error) {
              reject(msg.error);
            } else {
              resolve(msg.body);
            }
          });
        });
      },
      [Protocol.HTTP]: (apiName, payload) => {
        // TODO: Implement
      },
    });
  }

  // Put codes which do not need to be rendered by server.
  componentDidMount() {
    // Initialize socket
    const socket = this._socket = io(CONFIG_GAME_SERVER_URL);

    // Initialize store for code
    const codeStore = this.codeStore = new GameStore();
    codeStore.connect(socket);

    const api = this.createAdapter(socket);

    // addon-code-editor
    this.addons.push(require('@pasta/addon-code-editor').default(
      this.refs['addonCodeEditor'], socket, codeStore
    ));

    // addon-voxel-editor
    this.addons.push(require('@pasta/addon-voxel-editor').default(
      this.refs['addonVoxelEditor'], data => {
        this._socket.emit('voxels', data);
      }
    ));

    // addon-game
    this.addons.push(require('@pasta/addon-game').default(
      this.refs['addonGame'], codeStore, api
    ));

    /////////////////////////////////////////////////////////////////////////
    // Loop
    /////////////////////////////////////////////////////////////////////////

    var time;
    const update = () => {
      this.frameId = requestAnimationFrame(update);

      const now = new Date().getTime();
      const dt = now - (time || now);
      time = now;

      // Update store
      codeStore.update(dt);
    }
    update();
  }

  componentWillUnmount() {
    cancelAnimationFrame(this.frameId);
    this.addons.forEach(addon => addon.destroy());
    this._socket.disconnect();
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
