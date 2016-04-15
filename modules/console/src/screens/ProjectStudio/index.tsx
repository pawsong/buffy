import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { push } from 'react-router-redux';
import * as shortid from 'shortid';
import { SerializedGameObject } from '@pasta/core/lib/classes/GameObject';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { Project, ProjectData, SerializedLocalServer } from '@pasta/core/lib/Project';

import LocalServer from '../../LocalServer';
import { connectApi, preloadApi, ApiCall, get, ApiDispatchProps } from '../../api';
import { State } from '../../reducers';
import { User } from '../../reducers/users';
import { saga, SagaProps, ImmutableTask } from '../../saga';
import * as StorageKeys from '../../constants/StorageKeys';
import Studio, { StudioState } from '../../containers/Studio';
import ProjectStudio from '../../components/ProjectStudio';
import { requestLogout } from '../../actions/auth';

import {
  createAnonProject,
  createUserProject,
} from './sagas';

interface ProjectStudioHandlerState {
  initialized?: boolean;
  initialLocalServer?: SerializedLocalServer;
  studioState?: StudioState;
}

enum ProjectStudioMode {
  CREATE,
  ANON_EDIT,
  USER_EDIT,
}

interface RouteParams {
  userId: string;
  projectId: string;
}

function inferProjectStudioMode(params: RouteParams): ProjectStudioMode {
  if (params.projectId) {
    return params.userId ? ProjectStudioMode.USER_EDIT : ProjectStudioMode.ANON_EDIT;
  }
  return ProjectStudioMode.CREATE;
}

interface ProjectStudioHandlerProps extends RouteComponentProps<RouteParams, RouteParams>, ApiDispatchProps, SagaProps {
  user: User;
  createAnonProject: ImmutableTask<{}>;
  createUserProject: ImmutableTask<{}>;
  project?: ApiCall<Project>;
  requestLogout?: () => any;
  push?: (location: HistoryModule.LocationDescriptor) => any;
}

interface ProjectStudioData {
  initialLocalServer: SerializedLocalServer;
  initialBlocklyXml: string;
}

@preloadApi<RouteParams>((params, location) => {
  const type = inferProjectStudioMode(params);
  if (type === ProjectStudioMode.CREATE) return;

  const project = type === ProjectStudioMode.ANON_EDIT
    ? get(`${CONFIG_API_SERVER_URL}/projects/anonymous/${params.projectId}`)
    : get(`${CONFIG_API_SERVER_URL}/projects/@${params.userId}/${params.projectId}`);

  return { project };
})
@connectApi()
@connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}), {
  requestLogout,
  push,
})
@saga({
  createAnonProject,
  createUserProject,
})
class ProjectStudioHandler extends React.Component<ProjectStudioHandlerProps, ProjectStudioHandlerState> {
  mode: ProjectStudioMode;

  constructor(props) {
    super(props);
    this.mode = inferProjectStudioMode(this.props.params);

    if (this.props.project && this.props.project.state === 'fulfilled') {
      this.state = this.createStateFromResponse(this.props.project.result);
    } else {
      this.state = { initialized: false };
    }
  }

  componentDidMount() {
    if (this.mode === ProjectStudioMode.CREATE) {
      this.setState(this.createStateFromLocalStorage());
    }
  }

  componentWillReceiveProps(nextProps: ProjectStudioHandlerProps) {
    if (this.props.params !== nextProps.params) {
      this.mode = inferProjectStudioMode(nextProps.params);
    }

    if (this.state.initialized) return;

    if (nextProps.project && nextProps.project.state === 'fulfilled') {
      this.setState(this.createStateFromResponse(nextProps.project.result));
    }
  }

  createStateFromLocalStorage(): ProjectStudioHandlerState {
    return {
      initialized: true,
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
      initialized: true,
      initialLocalServer: project.server,
      studioState: Studio.creatState({
        codeEditorState: { blocklyXml: project.blocklyXml },
      }),
    };
  }

  handleSave(data: ProjectData) {
    const mode = inferProjectStudioMode(this.props.routeParams);
    switch (mode) {
      case ProjectStudioMode.CREATE: {
        if (this.props.user) {
          this.props.runSaga(this.props.createUserProject, this.props.user.id, data);
        } else {
          this.props.runSaga(this.props.createAnonProject, data);
        }
        return;
      }
      case ProjectStudioMode.ANON_EDIT: {
        const { projectId } = this.props.routeParams;
        console.log(projectId);
        // this.props.runSaga(this.props.save, projectId, data);
        return;
      }
      case ProjectStudioMode.USER_EDIT: {
        const { projectId, userId } = this.props.routeParams;
        console.log(projectId, userId);
        // this.props.runSaga(this.props.save, data);
        return;
      }
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
    if (!this.state.initialized) {
      return <div>Loading now...</div>;
    }

    const { initialLocalServer, studioState } = this.state;

    return (
      <ProjectStudio studioState={studioState}
                     onChange={studioState => this.handleStudioStateChange(studioState)}
                     initialLocalServer={initialLocalServer}
                     user={this.props.user}
                     location={this.props.location}
                     onLogout={() => this.props.requestLogout()}
                     onSave={data => this.handleSave(data)}
                     onPush={location => this.props.push(location)}
      />
    );
  }
}

export default ProjectStudioHandler;
