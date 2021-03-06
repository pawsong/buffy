import * as React from 'react';
import { Link } from 'react-router';
import Wrapper from '../../../../../components/Wrapper';

import * as Colors from 'material-ui/styles/colors';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../../../constants/Messages';

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

interface CourseListProps extends React.Props<CourseList> {
  fetching: boolean;
  courses: Object[];
}

class CourseList extends React.Component<CourseListProps, {}> {
  handleClickItem(course) {
    console.log(course);
  }

  getListItem(course, index) {
    const leftAvatarStyle = Object.assign({}, styles.courseImage, {
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
        containerElement={<Link to={`/courses/${course.id}`}></Link>}
      />
    );
  }

  render() {
    const courses = this.props.fetching ? null : this.props.courses.map((course, index) => this.getListItem(course, index));
    const spinner = this.props.fetching ? <div>Fetching...</div> : null;

    return (
      <Wrapper>
        {spinner}
        <List>
          {courses}
        </List>
      </Wrapper>
    );
  }
}

export default CourseList;
