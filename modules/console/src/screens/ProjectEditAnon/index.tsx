import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { push } from 'react-router-redux';
const update = require('react-addons-update');
import StateLayer from '@pasta/core/lib/StateLayer';
import { connectApi, preloadApi, ApiCall, get } from '../../api';
import { State } from '../../reducers';
import { User } from '../../reducers/users';
import { saga, SagaProps, ImmutableTask } from '../../saga';
import Studio from '../../containers/Studio';
import { Project } from '@pasta/core/lib/Project';
import LocalServer, { LocalSocket } from '../../LocalServer';
import PlayNavbar from './components/PlayNavbar';
import { requestLogout } from '../../actions/auth';

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
};

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
class ProjectEditAnon extends React.Component<ProjectEditAnonProps, ProjectEditAnonState> {
  socket: LocalSocket;
  server: LocalServer;
  stateLayer: StateLayer;

  initialized: boolean;

  constructor(props) {
    super(props);

    this.initialized = false;
    this.state = { studioState: {} };

    this.socket = new LocalSocket();

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

  componentWillReceiveProps(nextProps: ProjectEditAnonProps) {
    if (nextProps.project.state !== 'fulfilled') return;

    if (this.initialized) return;
    this.initialized = true;

    const { server } = nextProps.project.result;
    this.server = new LocalServer(server, this.socket);
    this.stateLayer.start(this.server.getInitData());
  }

  componentWillUnmount() {
    this.server.destroy();
    this.server = null;

    this.stateLayer.destroy();
    this.stateLayer = null;
  }

  handleSave() {
    const serialized = this.server.serialize();
    this.props.runSaga(this.props.save, serialized);
  }

  handleLogout() {
    this.props.requestLogout();
  }

  render() {
    if (this.props.project.state !== 'fulfilled') {
      return (
        <div>Loading project data ...</div>
      );
    }

    const { blocklyXml } = this.props.project.result;

    return (
      <div>
        <PlayNavbar user={this.props.user}
                    location={this.props.location}
                    onLogout={() => this.handleLogout()}
                    onSave={() => this.handleSave()}
                    onLinkClick={location => this.props.push(location)}
        />
        <Studio stateLayer={this.stateLayer} style={styles.studio}
                initialBlocklyXml={blocklyXml}
                studioState={this.state.studioState}
                onUpdate={studioState => this.setState(studioState)}
        />
      </div>
    );
  }
}

export default ProjectEditAnon;
