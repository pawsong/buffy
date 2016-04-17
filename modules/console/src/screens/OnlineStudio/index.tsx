import * as React from 'react';
import { Link } from 'react-router';
import StateLayer from '@pasta/core/lib/StateLayer';
import Studio, { StudioState } from '../../containers/Studio';

import * as io from 'socket.io-client';

import { InitParams } from '@pasta/core/lib/packet/ZC';

const NAVBAR_SIZE = 60;

const styles = {
  navbar: {
    height: NAVBAR_SIZE,
  },
  studio: {
    position: 'absolute',
    top: NAVBAR_SIZE,
    bottom: 0,
    left: 0,
    right: 0,
  },
};

interface OnlineStudioProps extends React.Props<OnlineStudio> {
  stateLayer: StateLayer;
}

interface OnlineStudioState {
  initialized?: boolean;
  studioState?: StudioState;
}

class OnlineStudio extends React.Component<OnlineStudioProps, OnlineStudioState> {
  stateLayer: StateLayer;
  socket: SocketIOClient.Socket;

  constructor(props) {
    super(props);
    this.state = { initialized: false };
  }

  componentDidMount() {
    this.stateLayer = new StateLayer({
      emit: (event, params, cb) => {
        this.socket.emit(event, params, cb);
      },
      listen: (event, handler) => {
        this.socket.addEventListener(event, handler);
        return () => this.socket.removeEventListener(event, handler);
      },
    });

    // Try to connect
    this.socket = io(CONFIG_GAME_SERVER_URL);
    this.socket.once('init', (params: InitParams) => {
      this.stateLayer.start(params);
      this.setState({
        initialized: true,
        studioState: Studio.creatState(),
      });
    });
  }

  componentWillUnmount() {
    this.stateLayer.destroy();
    this.socket.close();
  }

  renderGame() {
    return (<div>Hello game!</div>);
  }

  render() {
    if (!this.state.initialized) {
      return <div>Connecting...</div>;
    }

    return (
      <div>
        <div style={styles.navbar}>
          Draw navbar somehow
        </div>
        <Studio studioState={this.state.studioState}
                onChange={studioState => this.setState({ studioState })}
                stateLayer={this.stateLayer}
                style={styles.studio}
        />
      </div>
    );
  }
}

export default OnlineStudio;
