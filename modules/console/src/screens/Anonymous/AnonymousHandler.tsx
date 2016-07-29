import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { push } from 'react-router-redux';
import FontIcon from 'material-ui/FontIcon';
import Tabs from 'material-ui/Tabs/Tabs';
import Tab from 'material-ui/Tabs/Tab';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import { State } from '../../reducers';

import {
  requestRecommendedCourses,
} from '../../actions/course';

import {
  Course,
} from '../../reducers/course';

import AnonymousNavbar from '../../components/AnonymousNavbar';
import Footer from '../../components/Footer';

import { preloadApi, connectApi, ApiCall, get } from '../../api';

const messages = defineMessages({
  featuresLabel: {
    id: 'anon.navbar.features',
    description: 'Simple question to ask why this service is good',
    defaultMessage: 'Why?',
  },
  featuresForTeachersLabel: {
    id: 'anon.navbar.featuresForTeachers',
    description: 'Features for teachers page link button label',
    defaultMessage: 'Teachers',
  },
  getStarted: {
    id: 'anon.navbar.getStarted',
    description: 'Label for get started button',
    defaultMessage: 'Get Started',
  },
  create: {
    id: 'anon.navbar.create',
    description: 'Label for create button',
    defaultMessage: 'Create',
  },
});

interface AnonymousHandlerProps extends RouteComponentProps<{}, {}> {
  courses: ApiCall<Course[]>;
  push?: any;
  intl?: InjectedIntlProps;
}

@preloadApi(() => ({
  courses: get(`${CONFIG_API_SERVER_URL}/courses`),
}))
@connectApi()
@(connect(null, { push }) as any)
@injectIntl
class AnonymousHandler extends React.Component<AnonymousHandlerProps, {}> {
  handleTabChange(value) {
    this.props.push(value);
  }

  handleCreateClick = () => this.props.push('/model/edit');

  handleExploreClick = () => this.props.push('/explore');

  handleBlogClick = () => this.props.push('/blog');

  renderLeftToolbarGroup() {
    const index = this.props.location.pathname.indexOf('/', 1);
    const rootpath = index === -1 ? this.props.location.pathname : this.props.location.pathname.substr(0, index);

    // tabItemContainerStyle={{ height: '100%' }} for firefox
    // Tab style={{ height: '100%' }} for safari
    return (
      <Tabs
        value={rootpath}
        style={{ width: 300, display: 'inline-block', marginLeft: 30 }}
        tabItemContainerStyle={{ height: '100%' }}
      >
        <Tab
          style={{ height: '100%' }}
          value="/model/edit"
          onActive={this.handleCreateClick}
          icon={<FontIcon className="material-icons">brush</FontIcon>}
          label={this.props.intl.formatMessage(messages.create)}
        />
        <Tab
          style={{ height: '100%' }}
          value="/explore"
          onActive={this.handleExploreClick}
          icon={<FontIcon className="material-icons">explore</FontIcon>}
          label={this.props.intl.formatMessage(Messages.explore)}
        />
        <Tab
          style={{ height: '100%' }}
          value="/blog"
          onActive={this.handleBlogClick}
          icon={<FontIcon className="material-icons">chat_bubble</FontIcon>}
          label={this.props.intl.formatMessage(Messages.blog)}
        />
      </Tabs>
    );
  }

  render() {
    return (
      <div>
        <AnonymousNavbar
          location={this.props.location}
          height={72}
          leftToolbarGroup={this.renderLeftToolbarGroup()}
        />
        {this.props.children}
        <Footer />
      </div>
    );
  }
}

export default AnonymousHandler;
