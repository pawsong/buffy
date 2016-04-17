import * as React from 'react';

import * as invariant from 'invariant';

import StateLayer from '@pasta/core/lib/StateLayer';
import { Scripts } from '@pasta/core/lib/types';
import { Project } from '@pasta/core/lib/Project';

import Cardboard from '../Cardboard';
import LocalServer, { LocalSocket } from '../../LocalServer';

interface OnlineCardboardProps extends React.Props<OnlineCardboard> {
  project: Project;
}

class OnlineCardboard extends React.Component<OnlineCardboardProps, void> {
  // (fake) server interface
  socket: LocalSocket;
  server: LocalServer;
  stateLayer: StateLayer;

  constructor(props, context) {
    super(props, context);

    this.stateLayer = new StateLayer({
      emit: (event, params, cb) => {
        this.socket.emit(event, params, cb);
      },
      listen: (event, handler) => {
        const token = this.socket.addListener(event, handler);
        return () => token.remove();
      },
    });
  }

  componentWillUnmount() {
    if (this.stateLayer) this.stateLayer.destroy();
    if (this.server) this.server.destroy();
    // if (this.socket) this.socket.close();
  }

  handleStart() {
    invariant(this.props.project, 'project props does not exist');

    this.socket = new LocalSocket();
    const { server, scripts } = this.props.project;

    this.server = new LocalServer(server, this.socket);
    this.stateLayer.start(this.server.getInitData());
  }

  render() {
    const scripts: Scripts = this.props.project ? this.props.project.scripts : null;

    return (
      <Cardboard stateLayer={this.stateLayer}
                 onStart={() => this.handleStart()}
                 scripts={scripts}
      />
    );
  }
}

export default OnlineCardboard;
