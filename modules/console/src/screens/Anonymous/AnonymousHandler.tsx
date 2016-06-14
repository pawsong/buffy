import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { push } from 'react-router-redux';
import FontIcon from 'material-ui/FontIcon';
import Tabs from 'material-ui/Tabs/Tabs';
import Tab from 'material-ui/Tabs/Tab';
import { defineMessages, injectIntl, InjectedIntlProps } from 'react-intl';

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

  renderLeftToolbarGroup() {
    return null;

    // // tabItemContainerStyle={{ height: '100%' }} for firefox
    // // Tab style={{ height: '100%' }} for safari
    // return (
    //   <Tabs
    //     value={this.props.location.pathname}
    //     onChange={value => this.handleTabChange(value)}
    //     style={{ width: 113, display: 'inline-block', marginLeft: 30 }}
    //     tabItemContainerStyle={{ height: '100%' }}
    //   >
    //     <Tab
    //       style={{ height: '100%' }}
    //       value="/get-started"
    //       icon={<FontIcon className="material-icons">play_arrow</FontIcon>}
    //       label={this.props.intl.formatMessage(messages.getStarted)}
    //     />
    //   </Tabs>
    // );
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
