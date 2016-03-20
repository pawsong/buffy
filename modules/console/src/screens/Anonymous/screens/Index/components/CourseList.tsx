import * as React from 'react';
import { Link } from 'react-router';
import Wrapper from '../../../../../components/Wrapper';

const objectAssign = require('object-assign');

import Colors from 'material-ui/lib/styles/colors';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';

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
      />
    );
  }

  render() {
    const courses = this.props.fetching ? null : this.props.courses.map((course, index) => this.getListItem(course, index));
    const spinner = this.props.fetching ? <div>Fetching...</div> : null;

    return (
      <Wrapper style={styles.root}>
        <div>
          <h1><FormattedMessage {...Messages.courses}/></h1>
        </div>
        {spinner}
        <List>
          {courses}
        </List>
      </Wrapper>
    );
  }
}

export default CourseList;
