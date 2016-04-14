import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { push } from 'react-router-redux';
import { connectApi, preloadApi, ApiCall, get } from '../../api';
import { State } from '../../reducers';
import { User } from '../../reducers/users';
import { saga, SagaProps, ImmutableTask } from '../../saga';

import ProjectStudio from '../../components/ProjectStudio';

import { Project, ProjectData } from '@pasta/core/lib/Project';
import { requestLogout } from '../../actions/auth';
import { save } from './sagas';

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
  handleSave(data: ProjectData) {
    console.log(data);
    // const serialized = this.server.serialize();
    // this.props.runSaga(this.props.save, serialized);
  }

  render() {
    if (this.props.project.state !== 'fulfilled') {
      return (
        <div>Loading project data ...</div>
      );
    }

    const { blocklyXml, server } = this.props.project.result;
    return (
      <ProjectStudio user={this.props.user}
                     location={this.props.location}
                     onLogout={() => this.props.requestLogout()}
                     onSave={data => this.handleSave(data)}
                     onPush={location => this.props.push(location)}
                     initialBlocklyXml={blocklyXml}
                     initialLocalServer={server}
      />
    );
  }
}

export default ProjectEditAnon;
