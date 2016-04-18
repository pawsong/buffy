import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import RaisedButton from 'material-ui/lib/raised-button';
import ClearFix from 'material-ui/lib/clearfix';

import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../../../constants/Messages';
import Wrapper from '../../../../../components/Wrapper';

import { State } from '../../../../../reducers';
import { User } from '../../../../../reducers/users';
import { Course } from '../../../../../reducers/course';
import Footer from '../../../../../components/Footer';
import { saga } from '../../../../../saga';
import { connectApi, preloadApi, ApiCall, get } from '../../../../../api';

interface ProjectSummary {
  id: string;
  name: string;
  desc: string;
}

const messages = defineMessages({
  createProject: {
    id: 'create.project',
    description: 'Create a new project button label',
    defaultMessage: 'Create a new project',
  },
});

const styles = {
  button: {
    float: 'right', marginTop: 50,
  },
};

interface DashboardProps extends React.Props<Dashboard> {
  user?: User;
  projects?: ApiCall<ProjectSummary[]>;
  intl?: InjectedIntlProps;
}

@preloadApi(() => ({
  projects: get(`${CONFIG_API_SERVER_URL}/projects/me`),
}))
@connectApi()
@connect((state: State) => {
  return {
    user: state.users.get(state.auth.userid),
  };
})
@injectIntl
class Dashboard extends React.Component<DashboardProps, {}> {
  renderProjectList() {
    // TODO: Make sure user props exists.
    if (!this.props.user) return null;

    const projects = this.props.projects.state !== 'fulfilled' ? [] : this.props.projects.result;

    const listBody = projects.map(project => {
      return (
        <ListItem key={project.id} primaryText={project.id}
                  linkButton={true}
                  containerElement={<Link to={`/@${this.props.user.username}/${project.id}/latest/edit`}></Link>}
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
      <div>
        <Wrapper>
          <RaisedButton style={styles.button}
                        secondary={true}
                        linkButton={true}
                        containerElement={<Link to="/create" />}
                        label={this.props.intl.formatMessage(messages.createProject)}
          />
          <ClearFix />
          <h1>Projects</h1>
          {projectList}
        </Wrapper>
      </div>
    );
  }
}

export default Dashboard;
