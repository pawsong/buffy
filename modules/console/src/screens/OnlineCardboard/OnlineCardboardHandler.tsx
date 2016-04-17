import * as React from 'react';
import { RouteComponentProps, Link } from 'react-router';
import * as io from 'socket.io-client';

import StateLayer from '@pasta/core/lib/StateLayer';
import { Scripts } from '@pasta/core/lib/types';
import { InitParams } from '@pasta/core/lib/packet/ZC';

import { connectApi, preloadApi, ApiCall, get } from '../../api';

import Cardboard from '../../components/Cardboard';

interface OnlineCardboardHandlerProps extends React.Props<OnlineCardboardHandler> {}

const defaultScripts: Scripts = {};

interface OnlineCardboardHandlerState {
  scripts: Scripts;
}

@connectApi()
class OnlineCardboardHandler extends React.Component<OnlineCardboardHandlerProps, OnlineCardboardHandlerState> {
  socket: SocketIOClient.Socket;
  stateLayer: StateLayer;

  constructor(props) {
    super(props);

    this.stateLayer = new StateLayer({
      emit: (event, params, cb) => {
        this.socket.emit(event, params, cb);
      },
      listen: (event, handler) => {
        this.socket.addEventListener(event, handler);
        return () => this.socket.removeEventListener(event, handler);
      },
    });

    this.state = { scripts: null };
  }

  componentDidMount() {
    this.socket = io(CONFIG_GAME_SERVER_URL);
    this.socket.once('init', (params: InitParams) => {
      this.stateLayer.start(params);
      this.setState({ scripts: defaultScripts });
    });
  }

  componentWillUnmount() {
    this.stateLayer.destroy();
    this.socket.close();
  }

  handleStart() {
    // TODO: Try to connect to server here.
  }

  render() {
    return (
      <Cardboard stateLayer={this.stateLayer}
                 onStart={() => this.handleStart()}
                 scripts={this.state.scripts}
      />
    );
  }
}

export default OnlineCardboardHandler;
