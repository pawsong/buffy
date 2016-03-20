import * as React from 'react';
import { connect } from 'react-redux';
import { State } from '../../../../reducers';

import {
  requestRecommendedCourses,
} from '../../../../actions/course';

import {
  Course,
} from '../../../../reducers/course';

import Banner from './components/Banner';
import CourseList from './components/CourseList';
import Footer from '../../../../components/Footer';

import { preloadApi, connectApi, ApiCall, get } from '../../../../api';

interface IndexHandlerProps extends React.Props<IndexHandler> {
  courses: ApiCall<Course[]>;
}

@preloadApi(() => ({
  courses: get(`${CONFIG_API_SERVER_URL}/courses`),
}))
@connectApi()
class IndexHandler extends React.Component<IndexHandlerProps, {}> {
  render() {
    return (
      <div>
        <Banner />
        <CourseList fetching={this.props.courses.state !== 'fulfilled'}
                    courses={this.props.courses.result}
        />
      </div>
    );
  }
}

export default IndexHandler;
