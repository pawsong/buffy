import * as React from 'react';
import { connect } from 'react-redux';
import { State } from '../../../../reducers';
import { User } from '../../../../reducers/users';
import { Course } from '../../../../reducers/course';
import Footer from '../../../../components/Footer';
import { saga } from '../../../../saga';
import { connectApi, preloadApi, ApiCall, get } from '../../../../api';

import CourseList from './components/CourseList';

interface IndexHandlerProps extends React.Props<IndexHandler> {
  user: User;
  courses: ApiCall<Course[]>;
  request: any;
}

@preloadApi(() => ({
  courses: get(`${CONFIG_API_SERVER_URL}/courses`),
}))
@connectApi()
class IndexHandler extends React.Component<IndexHandlerProps, {}> {
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

export default IndexHandler;
