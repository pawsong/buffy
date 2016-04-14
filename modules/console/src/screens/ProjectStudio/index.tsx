import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { push } from 'react-router-redux';
import * as shortid from 'shortid';
import { SerializedGameObject } from '@pasta/core/lib/classes/GameObject';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { Project, ProjectData, SerializedLocalServer } from '@pasta/core/lib/Project';

import { connectApi, preloadApi, ApiCall, get, ApiDispatchProps } from '../../api';
import { State } from '../../reducers';
import { User } from '../../reducers/users';
import { saga, SagaProps, ImmutableTask } from '../../saga';
import * as StorageKeys from '../../constants/StorageKeys';
import ProjectStudio from '../../components/ProjectStudio';
import { requestLogout } from '../../actions/auth';

import { save } from './sagas';

interface ProjectStudioHandlerState {
  initialData?: ProjectStudioData;
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

interface ProjectStudioHandlerProps extends RouteComponentProps<{}, {}>, ApiDispatchProps, SagaProps {
  user: User;
  save: ImmutableTask<{}>;
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
    ? get(`${CONFIG_API_SERVER_URL}/projects/${params.projectId}`)
    : get(`${CONFIG_API_SERVER_URL}/projects/${params.projectId}`);

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
  save: save,
})
class ProjectStudioHandler extends React.Component<ProjectStudioHandlerProps, ProjectStudioHandlerState> {
  cachedProjectStudioData: ProjectStudioData;

  constructor(props) {
    super(props);
    this.cachedProjectStudioData = null;

    // State is used in create mode. Build initial state on componentDidMount()
    this.state = { initialData: null };
  }

  componentDidMount() {
    if (!this.props.project) {
      this.setState({ initialData: this.createInitialData() });
    }
  }

  createInitialData(): ProjectStudioData {
    const userId = shortid.generate();

    // const
    const serializedGameObject: SerializedGameObject = {
      id: userId,
      position: {
        x: 1,
        y: 0,
        z: 1,
      },
      mesh: null,
      direction: { x: 0, y: 0, z: 1 },
    };

    // Initialize data
    const serializedGameMap: SerializedGameMap = {
      id: shortid.generate(),
      name: '',
      width: 10,
      depth: 10,
      terrains: [],
      objects: [serializedGameObject],
    };

    return {
      initialBlocklyXml: localStorage.getItem(StorageKeys.BLOCKLY_WORKSPACE) || '',
      initialLocalServer: {
        myId: userId,
        maps: [serializedGameMap],
      },
    };
  }

  createInitialDataFromResponse(project: Project): ProjectStudioData {
    return {
      initialBlocklyXml: project.blocklyXml,
      initialLocalServer: project.server,
    };
  }

  getProjectStudioData(): ProjectStudioData {
    if (this.cachedProjectStudioData) return this.cachedProjectStudioData;

    if (this.props.project) {
      const { state, result } = this.props.project;
      if (state === 'fulfilled') {
        this.cachedProjectStudioData = this.createInitialDataFromResponse(result);
      }
    } else {
      if (this.state.initialData) {
        this.cachedProjectStudioData = this.state.initialData;
      }
    }

    return this.cachedProjectStudioData;
  }

  handleSave(data: ProjectData) {
    this.props.runSaga(this.props.save, data);
  }

  render() {
    const data = this.getProjectStudioData();

    if (!data) {
      return <div>Loading now...</div>;
    }

    const { initialBlocklyXml, initialLocalServer } = data;

    return (
      <ProjectStudio user={this.props.user}
                     location={this.props.location}
                     onLogout={() => this.props.requestLogout()}
                     onSave={data => this.handleSave(data)}
                     onPush={location => this.props.push(location)}
                     initialBlocklyXml={initialBlocklyXml}
                     initialLocalServer={initialLocalServer}
      />
    );
  }
}

export default ProjectStudioHandler;
