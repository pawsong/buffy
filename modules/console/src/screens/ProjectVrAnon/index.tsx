import * as React from 'react';
import { RouteComponentProps, Link } from 'react-router';

import { Project } from '@pasta/core/lib/Project';
import { connectApi, preloadApi, ApiCall, get } from '../../api';

import ProjectCardboard from '../../components/ProjectCardboard';

interface ProjectVrAnonRouteParams {
  projectId: string;
}
interface ProjectVrAnonParams extends ProjectVrAnonRouteParams {}

interface ProjectVrAnonProps
    extends RouteComponentProps<ProjectVrAnonParams, ProjectVrAnonRouteParams> {
  project: ApiCall<Project>;
}

@preloadApi<ProjectVrAnonParams>(params => ({
  project: get(`${CONFIG_API_SERVER_URL}/projects/anonymous/${params.projectId}`),
}))
@connectApi()
class ProjectVrAnon extends React.Component<ProjectVrAnonProps, {}> {
  render() {
    const project = this.props.project.state === 'fulfilled' ? this.props.project.result : null;
    return (<ProjectCardboard project={project}/>);
  }
}

export default ProjectVrAnon;
