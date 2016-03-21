import * as React from 'react';
import { connect } from 'react-redux';
import RaisedButton from 'material-ui/lib/raised-button';
import Colors from 'material-ui/lib/styles/colors';
import { State } from '../../../../reducers';
import Wrapper from '../../../../components/Wrapper';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../../constants/Messages';

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

const messages = defineMessages({
  wantToLearnMore: {
    id: 'anon.index.wantToLearnMore',
    description: 'Suggest clicking tutorial link button',
    defaultMessage: 'Want to learn more about {service}?',
  },
  takeTutorial: {
    id: 'anon.index.takeTutorial',
    description: 'Tutorial link button label',
    defaultMessage: 'Take a live tutorial',
  },
  introduceVoxelEditorHeader: {
    id: 'anon.index.introduceVoxelEditor.header',
    description: 'Introduce voxel editor to new users (header)',
    defaultMessage: 'Craft your friend!',
  },
  introduceVoxelEditorBody: {
    id: 'anon.index.introduceVoxelEditor.body',
    description: 'Introduce voxel editor to new users (body)',
    defaultMessage: 'Make your own robot with cubes',
  },
  introduceCodeEditorHeader: {
    id: 'anon.index.introduceCodeEditor.header',
    description: 'Introduce code editor to new users (header)',
    defaultMessage: 'Tell it to do something!',
  },
  introduceCodeEditorBody: {
    id: 'anon.index.introduceCodeEditor.body',
    description: 'Introduce code editor to new users (body)',
    defaultMessage: 'You can control your robot with code blocks',
  },
  takeCourses: {
    id: 'anon.index.takeCourses',
    description: 'Introduce recommended courses to new users',
    defaultMessage: 'Take awesome online courses!',
  },
  areYouTeacher: {
    id: 'anon.index.areYouTeacher',
    description: 'Introduce detailed info for teachers',
    defaultMessage: 'Are you a teacher?',
  },
  seeTeacherInfo: {
    id: 'anon.index.seeTeacherInfo',
    description: 'Label for teacher info link',
    defaultMessage: 'See more info for you',
  },
});

const styles = {
  centerWrapper: {
    textAlign: 'center',
  },
  header: {
    marginTop: 60,
    fontWeight: 'normal',
  },
  learnMoreWrapper: {
    backgroundColor: Colors.grey200,
    marginTop: 60,
    marginBottom: 60,
    padding: 80,
    textAlign: 'center',
  },
  learnMoreHeader: {
    marginTop: 0,
    marginBottom: 30,
    fontWeight: 'normal',
  },
};



interface IndexHandlerProps extends React.Props<IndexHandler> {
  courses: ApiCall<Course[]>;
  intl?: InjectedIntlProps;
}

@injectIntl
@preloadApi(() => ({
  courses: get(`${CONFIG_API_SERVER_URL}/courses`),
}))
@connectApi()
class IndexHandler extends React.Component<IndexHandlerProps, {}> {
  render() {
    return (
      <div>
        <Banner />
        <Wrapper>
          <h1 style={styles.header}>
            <FormattedMessage {...messages.introduceVoxelEditorHeader} />
          </h1>
          <FormattedMessage {...messages.introduceVoxelEditorBody} />
          <p>--- DESIGN EXAMPLE GIF ---</p>

          <h1 style={styles.header}>
            <FormattedMessage {...messages.introduceCodeEditorHeader} />
          </h1>
          <FormattedMessage {...messages.introduceCodeEditorBody} />
          <p>--- CODING EXAMPLE GIF ---</p>

          <h1 style={styles.header}>
            <FormattedMessage {...messages.takeCourses} />
          </h1>
          <CourseList fetching={this.props.courses.state !== 'fulfilled'}
                      courses={this.props.courses.result}
          />
        </Wrapper>
        <Wrapper style={styles.learnMoreWrapper}>
          <h1 style={styles.learnMoreHeader}>
            <FormattedMessage {...messages.wantToLearnMore} values={{
              service: this.props.intl.formatMessage(Messages.service),
            }} />
          </h1>
          <RaisedButton secondary={true}
                        label={this.props.intl.formatMessage(messages.takeTutorial)}
          />
          <div style={{ height: 100 }}/>
          <h1 style={styles.learnMoreHeader}>
            <FormattedMessage {...messages.areYouTeacher} />
          </h1>
          <RaisedButton secondary={true}
                        label={this.props.intl.formatMessage(messages.seeTeacherInfo)}
          />
        </Wrapper>
      </div>
    );
  }
}

export default IndexHandler;
