import * as React from 'react';
import { RouteComponentProps, Link } from 'react-router';
import * as invariant from 'invariant';

import { Scripts } from '@pasta/core/lib/types';
import { Project } from '@pasta/core/lib/Project';
import StateLayer from '@pasta/core/lib/StateLayer';

import { connectApi, preloadApi, ApiCall, get } from '../../api';
import Cardboard from '../../components/Cardboard';
import LocalServer, { LocalSocket } from '../../LocalServer';

interface RouteParams {
  username: string;
  projectId: string;
}

enum ProjectGameMode {
  ANON,
  USER,
}

function inferProjectCardboardMode(params: RouteParams): ProjectGameMode {
  return params.username ? ProjectGameMode.USER : ProjectGameMode.ANON;
}

interface Params extends RouteParams {}

interface HandlerProps extends RouteComponentProps<Params, RouteParams> {
  project: ApiCall<Project>;
}

@preloadApi<RouteParams>(params => {
  const project = inferProjectCardboardMode(params) === ProjectGameMode.ANON
    ? get(`${CONFIG_API_SERVER_URL}/projects/anonymous/${params.projectId}`)
    : get(`${CONFIG_API_SERVER_URL}/projects/@${params.username}/${params.projectId}`);

  return { project };
})
@connectApi()
class ProjectGameHandler extends React.Component<HandlerProps, void> {
    // (fake) server interface
  socket: LocalSocket;
  server: LocalServer;
  stateLayer: StateLayer;

  constructor(props, context) {
    super(props, context);

    this.stateLayer = new StateLayer({
      emit: (event, params, cb) => {
        this.socket.emitFromClientToServer(event, params, cb);
      },
      listen: (event, handler) => {
        const token = this.socket.addEventFromServerListener(event, handler);
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
    invariant(this.props.project.state === 'fulfilled', 'project props does not exist');

    this.socket = new LocalSocket();
    const { server } = this.props.project.result;

    // this.server = new LocalServer(server, this.socket);
    // this.stateLayer.start(this.server.getInitData());
  }

  render() {
    const project = this.props.project.state === 'fulfilled' ? this.props.project.result : null;
    const scripts: Scripts = project ? project.scripts : null;

    return null;

    // return (
    //   <Cardboard stateLayer={this.stateLayer}
    //              onStart={() => this.handleStart()}
    //              scripts={scripts}
    //   />
    // );
  }
}

export default ProjectGameHandler;
