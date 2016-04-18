import * as React from 'react';
import { RouteComponentProps, Link } from 'react-router';

import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';

import Wrapper from '../../components/Wrapper';

import { connectApi, preloadApi, ApiCall, get } from '../../api';

interface RouteParams {
  username: string;
}

interface ProjectSummary {
  id: string;
  name: string;
  desc: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams> {
  projects?: ApiCall<ProjectSummary[]>
}

@preloadApi<RouteParams>((params) => ({
  projects: get(`${CONFIG_API_SERVER_URL}/projects/@${params.username}`),
}))
@connectApi()
class ProfileHandler extends React.Component<HandlerProps, {}> {
  renderProjectList() {
    const projects = this.props.projects.state !== 'fulfilled' ? [] : this.props.projects.result;

    const listBody = projects.map(project => {
      return (
        <ListItem key={project.id} primaryText={project.id}
                  linkButton={true}
                  containerElement={<Link to={`/@${this.props.params.username}/${project.id}/latest/edit`}></Link>}
        />
      );
    });

    return (
      <List>{listBody}</List>
    );
  }

  render() {
    const projectList = this.renderProjectList();

    return (
      <Wrapper>
        <h1>@{this.props.params.username}</h1>
        <h2>Projects</h2>
        <div>{projectList}</div>
      </Wrapper>
    );
  }
}

export default ProfileHandler;
