import * as React from 'react';
import { RouteComponentProps, Link } from 'react-router';

import * as Colors from 'material-ui/styles/colors';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import Wrapper from '../../components/Wrapper';

import { connectApi, preloadApi, ApiCall, get } from '../../api';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./ProfileHandler.css');

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
@withStyles(styles)
class ProfileHandler extends React.Component<HandlerProps, {}> {
  renderUserInfo() {
    if (this.props.user.state !== 'fulfilled') return null;
    const user = this.props.user.result;
    const picture = `${__CDN_BASE__}/${user.picture}`

    return (
      <div style={{ margin: '20px 10px' }}>
        <div style={{ textAlign: 'center' }}>
          <img src={picture} style={{ width: '100%' }} />
        </div>
        <div className={styles.nameContainer}>
          <div className={styles.name}>{user.name}</div>
          <div className={styles.username}>@{user.username}</div>
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
