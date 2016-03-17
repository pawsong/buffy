import * as React from 'react';
import { connect } from 'react-redux';
import { State } from '../../reducers';

import {
  requestRecommendedCourses,
} from '../../actions/course';

import {
  Course,
} from '../../reducers/course';

import LandingNavbar from './components/LandingNavbar';
import Banner from './components/Banner';
import CourseList from './components/CourseList';
import Footer from '../../components/Footer';

import { preloadApi, connectApi, ApiCall, get } from '../../api';

interface LandingHandlerProps extends React.Props<LandingHandler> {
  courses: ApiCall<Course[]>;
}

@preloadApi(() => ({
  courses: get(`${CONFIG_API_SERVER_URL}/courses`),
}))
@connectApi()
class LandingHandler extends React.Component<LandingHandlerProps, {}> {
  render() {
    return (
      <div>
        <LandingNavbar />
        <Banner />
        <CourseList fetching={this.props.courses.state !== 'fulfilled'}
                    courses={this.props.courses.result}
        />
        <Footer />
      </div>
    );
  }
}

export default LandingHandler;
