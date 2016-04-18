import * as React from 'react';
import { RouteComponentProps, Link } from 'react-router';

import Colors from 'material-ui/lib/styles/colors';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import Wrapper from '../../components/Wrapper';

import { connectApi, preloadApi, ApiCall, get } from '../../api';

const styles = {
  nameContainer: {
    marginTop: 10,
  },
  name: {
    fontSize: 26,
    lineHeight: '30px',
  },
  username: {
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: 300,
    lineHeight: '24px',
    color: Colors.grey500,
  },
};

const messages = defineMessages({
  popularProjects: {
    id: 'popular.projects',
    description: 'Popular projects',
    defaultMessage: 'Popular projects',
  },
});

interface RouteParams {
  username: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  picture: string;
}

interface ProjectSummary {
  id: string;
  name: string;
  desc: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams> {
  user?: ApiCall<User>;
  projects?: ApiCall<ProjectSummary[]>;
}

@preloadApi<RouteParams>((params) => ({
  user: get(`${CONFIG_API_SERVER_URL}/users/${params.username}`),
  projects: get(`${CONFIG_API_SERVER_URL}/projects/@${params.username}`),
}))
@connectApi()
class ProfileHandler extends React.Component<HandlerProps, {}> {
  renderUserInfo() {
    if (this.props.user.state !== 'fulfilled') return null;
    const user = this.props.user.result;

    return (
      <div style={{ margin: '20px 10px' }}>
        <div style={{ textAlign: 'center' }}>
          <img src={user.picture} style={{ width: '100%' }} />
        </div>
        <div style={styles.nameContainer}>
          <div style={styles.name}>{user.name}</div>
          <div style={styles.username}>@{user.username}</div>
        </div>
      </div>
    );
  }

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
    const userInfo = this.renderUserInfo();

    const projectList = this.renderProjectList();

    return (
      <Wrapper style={{ marginTop: 30 }}>
        <div className="row">
          <div className="col-md-3">
            {userInfo}
          </div>
          <div className="col-md-9">
            <FormattedMessage tagName="h2" {...messages.popularProjects} />
            <div>{projectList}</div>
          </div>
        </div>
      </Wrapper>
    );
  }
}

export default ProfileHandler;
