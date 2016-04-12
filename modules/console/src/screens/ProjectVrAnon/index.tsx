import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { push } from 'react-router-redux';
const update = require('react-addons-update');
import { findDOMNode } from 'react-dom';
import StateLayer from '@pasta/core/lib/StateLayer';
import { InitParams } from '@pasta/core/lib/packet/ZC';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { connectApi, preloadApi, ApiCall, get } from '../../api';
import { State } from '../../reducers';
import { User } from '../../reducers/users';
import { UnitHandlerRouteParams } from '../Course/screens/Unit';
import { saga, SagaProps, ImmutableTask } from '../../saga';
import Studio from '../../containers/Studio';
import VrCanvas from '../../canvas/VrCanvas';
import { Runtime } from '../../runtime';
import LocalServer from './LocalServer';
import PlayNavbar from './components/PlayNavbar';
import {
  requestLogout,
} from '../../actions/auth';

import { save } from './sagas';

const NAVBAR_HEIGHT = 56;

const styles = {
  studio: {
    position: 'absolute',
    top: NAVBAR_HEIGHT,
    bottom: 0,
    left: 0,
    right: 0,
  },
  canvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
};

interface Project {
  name: string;
  desc: string;
  data: SerializedGameMap;
  blocklyXml: string;
  scripts: { [index: string]: string[] };
}

interface ProjectEditAnonRouteParams {
  projectId: string;
}
interface ProjectEditAnonParams extends ProjectEditAnonRouteParams {}

interface ProjectEditAnonProps
    extends RouteComponentProps<ProjectEditAnonParams, ProjectEditAnonRouteParams>, SagaProps {
  project: ApiCall<Project>;
  user: User;
  save: ImmutableTask<{}>;
  requestLogout?: () => any;
  push?: (location: HistoryModule.LocationDescriptor) => any;
}

interface ProjectEditAnonState {
  studioState?: any;
}

@preloadApi<ProjectEditAnonParams>(params => ({
  project: get(`${CONFIG_API_SERVER_URL}/projects/${params.projectId}`),
}))
@connectApi()
@saga({
  save: save,
})
@connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout,
  push,
})
class ProjectVrAnon extends React.Component<ProjectEditAnonProps, ProjectEditAnonState> {
  // (fake) server interface
  server: LocalServer;
  stateLayer: StateLayer;

  // Canvas
  canvas: VrCanvas;

  // Runtime
  runtime: Runtime;

  initialized: boolean;

  constructor(props) {
    super(props);

    this.initialized = false;

    // Initialize canvas
    this.server = new LocalServer();

    this.stateLayer = new StateLayer({
      emit: (event, params, cb) => {
        this.server.emit(event, params, cb);
      },
      listen: (event, handler) => {
        const token = this.server.addListener(event, handler);
        return () => token.remove();
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
    });
  }

  componentWillReceiveProps(nextProps: ProjectEditAnonProps) {
    if (this.initialized) return;
    this.initialized = true;

    if (nextProps.project.state !== 'fulfilled') return;

    const { data, scripts } = nextProps.project.result;

    this.server.initialize(data);
    this.stateLayer.start(this.server.getInitData());

    this.canvas = new VrCanvas({
      stateLayer: this.stateLayer,
      container: findDOMNode<HTMLElement>(this.refs['canvas']),
    });

    // Initialize code
    this.runtime = new Runtime(this.stateLayer);
    this.runtime.exec(scripts);
    this.runtime.emit('when_run');
  }

  componentWillUnmount() {
    if (this.runtime) this.runtime.destroy();
    if (this.canvas) this.canvas.destroy();

    this.stateLayer.destroy();
    this.server.destroy();
  }

  handleSave() {
    const serialized = this.server.serialize();
    this.props.runSaga(this.props.save, serialized);
  }

  handleLogout() {
    this.props.requestLogout();
  }

  render() {
    return (
      <div ref="canvas" style={styles.canvas}></div>
    );
  }
}

export default ProjectVrAnon;
