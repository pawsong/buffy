import React from 'react';
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

import Menu from 'material-ui/lib/menus/menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import IconMenu from 'material-ui/lib/menus/icon-menu';

import {
  SET_USER_DATA,
} from '../constants/ActionTypes';
import request from 'superagent';
import config from '@pasta/config-public';

import io from 'socket.io-client';

import createView from '@pasta/game-view';

import {
  Protocol,
  createAdapter,
} from '@pasta/game-api';

import {
  GameObject,
  GameStore,
  ObjectManager,
} from '@pasta/game-class';

const snippet =
`import player from '@pasta/player';
import tutil from '@pasta/util';

tutil.loop(async () => {
  await player.move(1, 1);
  await tutil.sleep(1000);
  await player.move(2, 3);
  await tutil.sleep(1000);
  await player.boom();
  await tutil.sleep(2000);
});`;

const styles = {
  tabs: {
    width: 400,
    marginLeft: 48,
  },
  toolbar: {
    height: config.navbarHeight,
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
    top: config.navbarHeight,
    right: 0,
    bottom: 0,
    left: 0,
  },
  leftPane: {
    position: 'absolute',
    top: config.navbarHeight,
    bottom: 0,
    left: 0,
    right: '50%',
  },
  rightPane: {
    position: 'absolute',
    top: config.navbarHeight,
    bottom: 0,
    left: '50%',
    right: 0,
    backgroundColor: 'rgb(232,232,232)',
  },
  editor: {
    position: 'absolute',
    top: config.navbarHeight,
    bottom: 0,
    left: 0,
    right: 0,
  },
  voxelEditor: {
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

class TabTemplate extends React.Component {
  render() {
    let styles = {
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

class Master extends React.Component {
  constructor(props) {
    super(props);

    this.child = {
      running: false,
    };
  }

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

  initilizeEditor() {
    const editor = this.editor = ace.edit('editor');
    editor.setTheme('ace/theme/twilight');
    editor.session.setMode('ace/mode/javascript');
    editor.setValue(snippet);
    editor.clearSelection();
  }

  // Put codes which do not need to be rendered by server.
  componentDidMount() {
    this.initilizeEditor();

    // Initialize socket
    const socket = this._socket = io(config.gameServerUrl);

    // Initialize store for code
    const codeStore = this.codeStore = new GameStore();
    codeStore.connect(socket);

    // Initialize view
    const viewStore = new GameStore();
    viewStore.connect(socket);

    const api = this.createAdapter(socket);
    const elem = document.getElementById('game');
    const view = createView(elem, viewStore, api);

    const voxelEditorElem = document.getElementById('voxelEditor');

    // This is ugly, but works...
    const voxelEditorContainer = voxelEditorElem.parentElement.parentElement;
    const createVoxelEditor = require('@pasta/voxel-editor').default;
    const voxelEditor = createVoxelEditor(voxelEditorElem, data => {
      socket.emit('voxels', data);
    });

    /////////////////////////////////////////////////////////////////////////
    // Loop
    /////////////////////////////////////////////////////////////////////////

    var time;
    function update() {
      requestAnimationFrame(update);

      const now = new Date().getTime();
      const dt = now - (time || now);
      time = now;

      // Update store
      viewStore.update(dt);
      codeStore.update(dt);

      // Update view
      view.render(dt);
      //voxelEditor.render(dt);
    }
    update();
  }

  onRun() {
    if (this.child.running) {
      this.child.running = false;
      this.child.worker.terminate();
      this.child.cancelPropagate();
    }

    (async () => {
      const source = this.editor.getValue();
      const { url } = await request.post('/code/compile')
        .send({ source }).exec();

      this.child.running = true;
      const worker = this.child.worker = new Worker(url);

      worker.addEventListener('message', ({ data }) => {
        const { id, apiName, payload, type } = data;

        // TODO: Validation
        //const api = apis[apiName];
        //if (!api) {
        //  return worker.postMessage({ id, error: 'Invalid api' });
        //}
        this._socket.emit(apiName, payload);

        // Wait response or not
        const result = {};
        worker.postMessage({ type: 'response', id, result });
      });

      // Propagate all events for store from socket to worker.
      this.child.cancelPropagate = this.codeStore.propagate((event, payload) => {
        worker.postMessage({
          type: 'socket',
          body: { event, payload },
        });
      });

      // Make a fake socket message with in-memory data.
      worker.postMessage({
        type: 'socket',
        body: {
          event: 'init',
          payload: this.codeStore.serialize(),
        },
      });

    })().catch(err => {
      // Unhandled exception.
      console.error(err.stack);
    });
  }

  onSignOut() {
    request
    .post('/api/logout')
    .exec()
    .then(() => {
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
          <div id="voxelEditor" style={styles.voxelEditor}></div>
        </Tab>
        <Tab label="Develop">
          <Toolbar style={styles.toolbar}>
            <ToolbarGroup key={0} float="left">
              <RaisedButton label="Run" style={{ marginTop: 6 }} primary={true} onClick={this.onRun.bind(this)}/>
            </ToolbarGroup>
          </Toolbar>
          <div id="editor" style={styles.editor}></div>
        </Tab>
      </Tabs>

      <IconMenu style={styles.avatarContainer} desktop={true} iconButtonElement={
        <Avatar style={styles.avatar} src={picture}/>
        }>
        <MenuItem primaryText="Sign out" onClick={this.onSignOut.bind(this)}/>
      </IconMenu>

      <div style={styles.rightPane}>
        <div id="game" style={styles.game}></div>
      </div>
  </div>
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
