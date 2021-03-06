import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { push } from 'react-router-redux';
import FontIcon from 'material-ui/FontIcon';
import Tabs from 'material-ui/Tabs/Tabs';
import Tab from 'material-ui/Tabs/Tab';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import HumanGreeting from '../../components/icons/HumanGreeting';
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

const styles = require('./AnonymousHandler.css');

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
@withStyles(styles)
@injectIntl
class AnonymousHandler extends React.Component<AnonymousHandlerProps, {}> {
  handleTabChange(value) {
    this.props.push(value);
  }

  handleCreateClick = () => this.props.push('/studio');

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
        className={styles.tabs}
        tabItemContainerStyle={{ height: '100%' }}
      >
        <Tab
          value="/tutorial"
          containerElement={<Link to="/tutorial" />}
          className={styles.tab}
          label={this.props.intl.formatMessage(Messages.tutorial)}
          icon={<HumanGreeting />}
        />
        <Tab
          value="/studio"
          containerElement={<Link to="/studio" />}
          className={styles.tab}
          label={this.props.intl.formatMessage(Messages.create)}
          icon={<FontIcon className="material-icons">brush</FontIcon>}
        />
        <Tab
          value="/explore"
          containerElement={<Link to="/explore" />}
          className={styles.tab}
          label={this.props.intl.formatMessage(Messages.explore)}
          icon={<FontIcon className="material-icons">explore</FontIcon>}
        />
        <Tab
          value="/blog"
          containerElement={<Link to="/blog" />}
          className={styles.tab}
          label={this.props.intl.formatMessage(Messages.blog)}
          icon={<FontIcon className="material-icons">chat_bubble</FontIcon>}
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
