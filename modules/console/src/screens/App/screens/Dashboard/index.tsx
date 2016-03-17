import * as React from 'react';
import { connect } from 'react-redux';
import { State } from '../../../../reducers';
import { User } from '../../../../reducers/users';
import { Course } from '../../../../reducers/course';
import Footer from '../../../../components/Footer';
import { saga } from '../../../../saga';
import { connectApi, preloadApi, ApiCall, get } from '../../../../api';

import CourseList from './components/CourseList';

interface DashboardHandlerProps extends React.Props<DashboardHandler> {
  user: User;
  courses: ApiCall<Course[]>;
  request: any;
}

@preloadApi(() => ({
  courses: get(`${CONFIG_API_SERVER_URL}/courses`),
}))
@connectApi()
class DashboardHandler extends React.Component<DashboardHandlerProps, {}> {
  render() {
    if (this.props.courses.state !== 'fulfilled') {
      return <div>Loading ...</div>;
    }

    return (
      <div>
        <CourseList courses={this.props.courses.result} />
        <Footer />
      </div>
    );
  }
}

export default DashboardHandler;
