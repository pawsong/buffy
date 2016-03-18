import * as React from 'react';
import { connect } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router';
import { State } from '../../../../reducers';
import { User } from '../../../../reducers/users';
import { Course } from '../../../../reducers/course';
import Footer from '../../../../components/Footer';
import { saga } from '../../../../saga';
import Wrapper from '../../../../components/Wrapper';
import RaisedButton from 'material-ui/lib/raised-button';

import CourseList from './components/CourseList';

export interface CourseHandlerRouteParams {
  courseId: string;
}
interface CourseHandlerParams extends CourseHandlerRouteParams {}

interface CourseHandlerProps extends RouteComponentProps<CourseHandlerParams, CourseHandlerRouteParams> {
  course: Course;
}

@connect((state: State, props: CourseHandlerProps) => ({
  course: state.course.courses.get(props.params.courseId),
  fetchingCourses: state.course.fetchingRecommendedCourses,
}))
class CourseHandler extends React.Component<CourseHandlerProps, {}> {
  render() {
    const { children } = this.props;
    return React.Children.only(children);
  }
}

export default CourseHandler;
