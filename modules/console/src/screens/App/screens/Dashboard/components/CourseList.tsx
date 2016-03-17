import * as React from 'react';
import { Link } from 'react-router';

import objectAssign = require('object-assign');
import Colors = require('material-ui/lib/styles/colors');

import List = require('material-ui/lib/lists/list');
const ListItem = require('material-ui/lib/lists/list-item');
import { Course } from '../../../../../reducers/course';
import Wrapper from '../../../../../components/Wrapper';

interface CourseListProps extends React.Props<CourseList> {
  courses: Course[];
}

class CourseList extends React.Component<CourseListProps, {}> {
  getListItem(course, index) {
    const leftAvatarStyle = objectAssign({}, styles.courseImage, {
      backgroundImage: `url(${course.thumbnail})`,
    });

    return (
      <ListItem
        key={index}
        primaryText={
          <h2>{course.title}</h2>
        }
        secondaryText={
          <div style={styles.courseDesc}>{course.description}</div>
        }
        secondaryTextLines={2}
        leftAvatar={<div style={leftAvatarStyle}></div>}
        innerDivStyle={styles.courseInnerDiv}
        linkButton={true}
        containerElement={<Link to={`/courses/${course.id}`}></Link>}
      ></ListItem>
    );
  }

  render() {
    const courses = this.props.courses.map((course, index) => this.getListItem(course, index));

    return (
      <Wrapper style={styles.root}>
        <div>
          <h1>Courses</h1>
        </div>
        <List>
          {courses}
        </List>
      </Wrapper>
    );
  }
}

export default CourseList;

const styles = {
  root: {
    marginTop: 60,
  },
  courseInnerDiv: {
    paddingLeft: 163,
    paddingBottom: 39,
  },
  courseImage: {
    width: 128,
    height: 128,
    backgroundPosition: 'center center',
    backgroundSize: 'auto 100%',
  },
  courseDesc: {
    fontSize: 20,
    lineHeight: '24px',
    height: 48,
  },
};
