import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { State } from '../../reducers';

import {
  requestRecommendedCourses,
} from '../../actions/course';

import {
  Course,
} from '../../reducers/course';

import AnonymousNavbar from './components/AnonymousNavbar';
import Footer from '../../components/Footer';

import { preloadApi, connectApi, ApiCall, get } from '../../api';

interface AnonymousHandlerProps extends RouteComponentProps<{}, {}> {
  courses: ApiCall<Course[]>;
}

@preloadApi(() => ({
  courses: get(`${CONFIG_API_SERVER_URL}/courses`),
}))
@connectApi()
class AnonymousHandler extends React.Component<AnonymousHandlerProps, {}> {
  render() {
    return (
      <div>
        <AnonymousNavbar location={this.props.location} />
        {this.props.children}
        <Footer />
      </div>
    );
  }
}

export default AnonymousHandler;
