import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { push } from 'react-router-redux';
import * as shortid from 'shortid';
import { SerializedGameObject } from '@pasta/core/lib/classes/GameObject';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { Project, ProjectData, SerializedLocalServer } from '@pasta/core/lib/Project';
import StateLayer from '@pasta/core/lib/StateLayer';

import LocalServer, { LocalSocket } from '../../LocalServer';
import { connectApi, preloadApi, ApiCall, get, ApiDispatchProps } from '../../api';
import { State } from '../../reducers';
import { User } from '../../reducers/users';
import { saga, SagaProps, ImmutableTask } from '../../saga';
import * as StorageKeys from '../../constants/StorageKeys';
import Studio, { StudioState } from '../../components/Studio';
import { RobotInstance, ZoneInstance } from '../../components/Studio';
import { requestLogout } from '../../actions/auth';
import { compileBlocklyXml } from '../../blockly/utils';

import ProjectStudioNavbar from './components/ProjectStudioNavbar';

import {
  createAnonProject,
  createUserProject,
  updateAnonProject,
  updateUserProject,
} from './sagas';

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

enum ProjectStudioMode {
  CREATE,
  ANON_EDIT,
  USER_EDIT,
}

interface RouteParams {
  username: string;
  projectId: string;
}

function inferProjectStudioMode(params: RouteParams): ProjectStudioMode {
  if (params.projectId) {
    return params.username ? ProjectStudioMode.USER_EDIT : ProjectStudioMode.ANON_EDIT;
  }
  return ProjectStudioMode.CREATE;
}

interface ProjectStudioHandlerProps extends RouteComponentProps<RouteParams, RouteParams>, ApiDispatchProps, SagaProps {
  user: User;
  createAnonProject: ImmutableTask<{}>;
  createUserProject: ImmutableTask<{}>;
  updateAnonProject: ImmutableTask<{}>;
  updateUserProject: ImmutableTask<{}>;
  project?: ApiCall<Project>;
  requestLogout?: () => any;
  push?: (location: HistoryModule.LocationDescriptor) => any;
}

interface ProjectStudioHandlerState {
  stateLayerIsRunning?: boolean;
  initialLocalServer?: SerializedLocalServer;
  studioState?: StudioState;
}

/*
 * ProjectStudioHandler component handles various modes to support url change without rerendering.
 *
 * Create mode: StateLayer is started in componentDidMount with localStorage data.
 * Edit mode (preloaded): StateLayer is started in componentDidMount with preloaded data.
 * Edit mode (not preloaded): StartLayer is started componentWillReceiveProps when response arrives.
 */

@preloadApi<RouteParams>((params, location) => {
  const type = inferProjectStudioMode(params);
  if (type === ProjectStudioMode.CREATE) return;

  const project = type === ProjectStudioMode.ANON_EDIT
    ? get(`${CONFIG_API_SERVER_URL}/projects/anonymous/${params.projectId}`)
    : get(`${CONFIG_API_SERVER_URL}/projects/@${params.username}/${params.projectId}`);

  return { project };
})
@connectApi()
@(connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout,
  push,
}) as any)
@saga({
  createAnonProject,
  createUserProject,
  updateAnonProject,
  updateUserProject,
})
class ProjectStudioHandler extends React.Component<ProjectStudioHandlerProps, ProjectStudioHandlerState> {
  mode: ProjectStudioMode;

  socket: LocalSocket;
  server: LocalServer;
  stateLayer: StateLayer;
  startStateLayerGuard: boolean;
  startStateLayerReserved: boolean;

  robots: RobotInstance[];
  zones: ZoneInstance[];

  constructor(props) {
    super(props);

    this.mode = inferProjectStudioMode(this.props.params);

    if (this.props.project && this.props.project.state === 'fulfilled') {
      this.state = this.createStateFromResponse(this.props.project.result);
      this.state.stateLayerIsRunning = false;
      this.startStateLayerReserved = true;
    } else {
      this.state = { stateLayerIsRunning: false };
      this.startStateLayerReserved = false;
    }

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

    this.startStateLayerGuard = false;
  }

  createStateFromLocalStorage(): ProjectStudioHandlerState {
    return {
      initialLocalServer: LocalServer.createInitialData(),
      studioState: Studio.creatState({
        codeEditorState: {
          blocklyXml: localStorage.getItem(StorageKeys.BLOCKLY_WORKSPACE_CREATE),
        },
      }),
    };
  }

  createStateFromResponse(project: Project): ProjectStudioHandlerState {
    return {
      initialLocalServer: project.server,
      studioState: Studio.creatState({
        codeEditorState: { blocklyXml: project.blocklyXml },
        voxelEditorState: { voxels: project.voxels },
      }),
    };
  }

  startStateLayer() {
    if (this.startStateLayerGuard) return;
    this.startStateLayerGuard = true;

    this.server = new LocalServer(this.state.initialLocalServer, this.socket);
    this.stateLayer.start(this.server.getInitData());

    this.robots = [{
      id: this.server.user.id,
      name: '(Untitled)',
      mapName: this.server.user.map.name || '(Untitled)',
    }];

    this.zones = this.server.maps.map(map => {
      return {
        id: map.id,
        name: map.name || '(Untitled)',
        width: map.width,
        depth: map.depth,
      };
    });

    this.setState({ stateLayerIsRunning: true });
  }

  componentDidMount() {
    if (this.startStateLayerReserved) {
      this.startStateLayer();
    } else if (this.mode === ProjectStudioMode.CREATE) {
      this.setState(this.createStateFromLocalStorage(), () => this.startStateLayer());
    }
  }

  componentWillReceiveProps(nextProps: ProjectStudioHandlerProps) {
    if (this.props.params !== nextProps.params) {
      this.mode = inferProjectStudioMode(nextProps.params);
    }

    if (this.state.stateLayerIsRunning || this.startStateLayerReserved) return;

    if (nextProps.project && nextProps.project.state === 'fulfilled') {
      this.setState(this.createStateFromResponse(nextProps.project.result), () => this.startStateLayer());
    }
  }

  componentWillUnmount() {
    if (this.server) {
      this.server.destroy();
      this.server = null;
    }

    this.stateLayer.destroy();
    this.stateLayer = null;
  }

  handleSave() {
    // Game
    const serialized = this.server.serialize();

    // Code editor
    const { blocklyXml } = this.state.studioState.codeEditorState;
    const scripts = compileBlocklyXml(blocklyXml);

    // Voxel editor
    const voxels = this.state.studioState.voxelEditorState.voxel.present.data.toJS();

    const data: ProjectData = {
      scripts,
      blocklyXml,
      server: serialized,
      voxels,
    };

    switch (this.mode) {
      case ProjectStudioMode.CREATE: {
        if (this.props.user) {
          this.props.runSaga(this.props.createUserProject, data);
        } else {
          this.props.runSaga(this.props.createAnonProject, data);
        }
        return;
      }
      case ProjectStudioMode.ANON_EDIT: {
        const { projectId } = this.props.routeParams;
        this.props.runSaga(this.props.updateAnonProject, projectId, data);
        return;
      }
      case ProjectStudioMode.USER_EDIT: {
        const { username, projectId } = this.props.routeParams;
        this.props.runSaga(this.props.updateUserProject, username, projectId, data);
        return;
      }
    }
  }

  handleVrModeRequest() {
    if (this.mode === ProjectStudioMode.ANON_EDIT) {
      this.props.push(`/@/${this.props.params.projectId}/latest/vr`);
    } else if (this.mode === ProjectStudioMode.USER_EDIT) {
      this.props.push(`/@${this.props.params.username}/${this.props.params.projectId}/latest/vr`);
    }
  }

  handleStudioStateChange(nextState: StudioState) {
    if (this.mode === ProjectStudioMode.CREATE) {
      if (this.state.studioState.codeEditorState.blocklyXml !== nextState.codeEditorState.blocklyXml) {
        localStorage.setItem(StorageKeys.BLOCKLY_WORKSPACE_CREATE, nextState.codeEditorState.blocklyXml);
      }
    }
    this.setState({ studioState: nextState });
  }

  render() {
    if (!this.state.stateLayerIsRunning) {
      return <div>Loading now...</div>;
    }

    return (
      <div>
        <ProjectStudioNavbar user={this.props.user}
                             location={this.props.location}
                             onLogout={() => this.props.requestLogout()}
                             onSave={() => this.handleSave()}
                             onLinkClick={location => this.props.push(location)}
                             vrModeAvaiable={this.mode !== ProjectStudioMode.CREATE}
                             onVrModeRequest={() => this.handleVrModeRequest()}
        />
        <Studio robotInstances={this.robots}
                zoneInstances={this.zones}
                studioState={this.state.studioState}
                onChange={studioState => this.handleStudioStateChange(studioState)}
                stateLayer={this.stateLayer} style={styles.studio}
        />
      </div>
    );
  }
}

export default ProjectStudioHandler;
