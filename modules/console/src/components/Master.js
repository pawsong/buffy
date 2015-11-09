import React from 'react';
import { connect } from 'react-redux';
import {
  Avatar,
  Toolbar,
  ToolbarGroup,
  ToolbarTitle,
  RaisedButton,
} from 'material-ui';

import Menu from 'material-ui/lib/menus/menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import IconMenu from 'material-ui/lib/menus/icon-menu';

import {
  SET_USER_DATA,
} from '../constants/ActionTypes';
import request from 'superagent';
import config from '@pasta/config';

import io from 'socket.io-client';

import createView from '@pasta/game-view';

import {
  Protocol,
  createAdapter,
} from '@pasta/game-api';

import ObjectManager from '@pasta/game-store/src/classes/ObjectManager';
import { GameObject } from '@pasta/game-class';

const snippet =
`import player from '@pasta/player';
import tutil from '@pasta/util';

tutil.loop(async () => {
  await player.move(1, 1);
  await tutil.sleep(1000);
  await player.move(2, 3);
  await tutil.sleep(1000);
});`;

const styles = {
  toolbar: {
    position: 'absolute',
    top: 0, right: 0, left: 0,
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
    top: 0,
    bottom: 0,
    left: 0,
    right: '50%',
  },
  rightPane: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    right: 0,
  },
  editor: {
    height: '100%',
    width: '100%',
  },
  game: {
    margin: 'auto',
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
    width: '600px',
    height: '480px',
    overflow: 'hidden',
  },
};

class Master extends React.Component {
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
    const editor = this.editor = ace.edit('editor');
    editor.setTheme('ace/theme/twilight');
    editor.session.setMode('ace/mode/javascript');
    editor.setValue(snippet);
    editor.clearSelection();

    // Create client game object manager.
    // This is store.
    const manager = this.manager = new ObjectManager(GameObject);
    const gameManager = new ObjectManager(GameObject);

    // Network layer.
    const socket = this._socket = io(`http://localhost:${config.gameServerPort}`);
    gameManager.connect(socket);

    // Will use another socket.
    manager
      .connect(socket)
      .propagate((event, payload) => {
        if (this.worker) {
          this.worker.postMessage({
            type: 'socket',
            body: { event, payload },
          });
        }
      });

    // Adapter.
    const api = this.createAdapter(socket);

    const elem = document.getElementById('game');
    const game = createView(elem, gameManager, api);

    /////////////////////////////////////////////////////////////////////////
    // Loop
    /////////////////////////////////////////////////////////////////////////

    var time;
    function update() {
      requestAnimationFrame(update);

      const now = new Date().getTime();
      const dt = now - (time || now);
      time = now;

      manager.update(dt);

      gameManager.update(dt);
      game.render();
    }
    update();
  }

  onRun() {

    (async () => {
      if (this.worker) {
        this.worker.terminate();
      }

      const source = this.editor.getValue();
      const result = await request.post('/code/compile')
        .send({ source }).exec();

      this.worker = new Worker(result.url);
      this.worker.addEventListener('message', ({ data }) => {
        const { id, apiName, payload, type } = data;

        // TODO: Validation
        //const api = apis[apiName];
        //if (!api) {
        //  return worker.postMessage({ id, error: 'Invalid api' });
        //}
        this._socket.emit(apiName, payload);

        // Wait response or not
        const result = {};
        this.worker.postMessage({ type: 'response', id, result });
      });

      // Make a fake socket message with in memory data.
      this.worker.postMessage({
        type: 'socket',
        body: {
          event: 'init',
          payload: this.manager.dump(),
        },
      });
    })().catch(err => {
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

    return <div>
      <Toolbar style={styles.toolbar}>
      <ToolbarGroup key={0} float="left">
        <ToolbarTitle text="TIAT"/>
        <RaisedButton label="Run" primary={true} onClick={this.onRun.bind(this)}/>
      </ToolbarGroup>
      <ToolbarGroup key={1} float="right">
        <IconMenu desktop={true} iconButtonElement={
          <Avatar style={styles.avatar} src={picture}/>
          }>
          <MenuItem primaryText="Sign out" onClick={this.onSignOut.bind(this)}/>
        </IconMenu>
      </ToolbarGroup>
    </Toolbar>
      <div style={styles.content}>
        <div style={styles.leftPane}>
          <div id="editor" style={styles.editor}></div>
        </div>
        <div style={styles.rightPane}>
          <div id="game" style={styles.game}></div>
        </div>
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
