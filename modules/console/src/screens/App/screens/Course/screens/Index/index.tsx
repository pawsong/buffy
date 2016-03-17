import * as React from 'react';
import { connect } from 'react-redux';
import { Link, RouteComponentProps } from 'react-router';
import { State } from '../../../../../../reducers';
import { User } from '../../../../../../reducers/users';
import { Course } from '../../../../../../reducers/course';
import Footer from '../../../../../../components/Footer';
import { saga } from '../../../../../../saga';
import Wrapper from '../../../../../../components/Wrapper';
import RaisedButton = require('material-ui/lib/raised-button');
import { connectApi, preloadApi, ApiCall, get } from '../../../../../../api';

interface CourseIndexHandlerRouteParams {
  courseId: string;
}
interface CourseIndexHandlerParams extends CourseIndexHandlerRouteParams {}

interface CourseIndexHandlerProps extends RouteComponentProps<CourseIndexHandlerParams, CourseIndexHandlerRouteParams> {
  course: ApiCall<Course>;
}

@preloadApi<CourseIndexHandlerRouteParams>(params => ({
  course: get(`${CONFIG_API_SERVER_URL}/courses/${params.courseId}`),
}))
@connectApi()
class CourseIndexHandler extends React.Component<CourseIndexHandlerProps, {}> {
  render() {
    const { course } = this.props;
    if (course.state !== 'fulfilled') {
      return <div>Waiting...</div>;
    }

    return (
      <div>
        <Wrapper>
          <h1>{course.result.title}</h1>
          <img src={course.result.thumbnail} />
          <p>{course.result.description}</p>
          <RaisedButton label="Take course" secondary={true} linkButton={true}
                        containerElement={<Link to={`/courses/${course.result.id}/units/${1}`}/>}
          />
        </Wrapper>
        <Footer />
      </div>
    );
  }
}

export default CourseIndexHandler;
