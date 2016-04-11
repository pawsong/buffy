import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import RaisedButton from 'material-ui/lib/raised-button';
import ClearFix from 'material-ui/lib/clearfix';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../../../constants/Messages';
import Wrapper from '../../../../components/Wrapper';

import { State } from '../../../../reducers';
import { User } from '../../../../reducers/users';
import { Course } from '../../../../reducers/course';
import Footer from '../../../../components/Footer';
import { saga } from '../../../../saga';
import { connectApi, preloadApi, ApiCall, get } from '../../../../api';

import CourseList from './components/CourseList';

const messages = defineMessages({
  createProject: {
    id: 'create.project',
    description: 'Create a new project button label',
    defaultMessage: 'Create a new project',
  },
});

const styles = {
  button: {
    float: 'right', marginTop: 50,
  },
};

interface IndexHandlerProps extends React.Props<IndexHandler> {
  user: User;
  courses: ApiCall<Course[]>;
  request: any;
  intl: InjectedIntlProps;
}

@preloadApi(() => ({
  courses: get(`${CONFIG_API_SERVER_URL}/courses`),
}))
@connectApi()
@injectIntl
class IndexHandler extends React.Component<IndexHandlerProps, {}> {
  render() {
    if (this.props.courses.state !== 'fulfilled') {
      return <div>Loading ...</div>;
    }

    return (
      <div>
        <Wrapper>
          <RaisedButton style={styles.button}
                        secondary={true}
                        linkButton={true}
                        containerElement={<Link to="/create" />}
                        label={this.props.intl.formatMessage(messages.createProject)}
          />
          <ClearFix />
        </Wrapper>
        <CourseList courses={this.props.courses.result} />
      </div>
    );
  }
}

export default IndexHandler;
