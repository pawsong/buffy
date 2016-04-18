import * as React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { call, put } from 'redux-saga/effects';

import Colors from 'material-ui/lib/styles/colors';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import TextField from 'material-ui/lib/text-field';
import RaisedButton from 'material-ui/lib/raised-button';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/messages';

import { State } from '../../reducers';
import { User } from '../../reducers/users';
import Wrapper from '../../components/Wrapper';

import { userUpdate } from '../../actions/users';

import { saga, SagaProps, ImmutableTask, isRunning, request } from '../../saga';

const styles = {
  nameContainer: {
    marginTop: 10,
  },
  name: {
    fontSize: 26,
    lineHeight: '30px',
  },
  username: {
    fontSize: 20,
    fontStyle: 'normal',
    fontWeight: 300,
    lineHeight: '24px',
    color: Colors.grey500,
  },
  fieldLabel: {
    fontSize: 20,
    marginTop: 30,
  }
};

const messages = defineMessages({
  profilePicture: {
    id: 'settings.profile.picture',
    description: 'Profile picture area title',
    defaultMessage: 'Profile picture',
  },
  uploadProfilePicture: {
    id: 'settings.upload.profile.picture',
    description: 'Upload profile picture button label',
    defaultMessage: 'Upload your picture',
  },
  name: {
    id: 'settings.name',
    description: 'Name area title',
    defaultMessage: 'Name',
  },
  updateProfile: {
    id: 'settings.update.profile',
    description: 'Update profile button label',
    defaultMessage: 'Update profile',
  },
});

interface RouteParams {
  username: string;
}

interface ProjectSummary {
  id: string;
  name: string;
  desc: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams>, SagaProps {
  user?: User;
  intl?: InjectedIntlProps;
  submitProfileUpdate?: ImmutableTask<any>;
}

interface HandlerState {
  name?: string;
}

@saga({
  submitProfileUpdate: function* (userId: string, name: string) {
    const response = yield call(request.put, `${CONFIG_API_SERVER_URL}/me`, {
      name,
    });
    console.log(response);
    if (response.status !== 200) {
      // TODO: Error handling
      return;
    }
    yield put(userUpdate(userId, { name }));
  },
})
@connect((state: State) => ({
  user: state.users.get(state.auth.userid),
}))
@injectIntl
class SettingsHandler extends React.Component<HandlerProps, HandlerState> {
  constructor(props) {
    super(props);
    this.state = { name: '' };
  }

  handleNameChange(name: string) {
    this.setState({ name });
  }

  hasNameChanged() {
    if (!this.props.user) return false;
    if (!this.state.name) return false;

    return this.props.user.name !== this.state.name;
  }

  handleProfilePictureUpload() {
    // TODO: Get signed s3 url, upload file and request db update.
  }

  handleSubmit() {
    if (!this.hasNameChanged()) return;
    this.props.runSaga(this.props.submitProfileUpdate, this.props.user.id, this.state.name);
  }

  render() {
    const { user } = this.props;
    if (!user) return null;

    return (
      <Wrapper style={{ marginTop: 15 }}>
        <h1>{this.props.intl.formatMessage(Messages.settings)}</h1>

        <div style={styles.fieldLabel}>{this.props.intl.formatMessage(messages.profilePicture)}</div>
        <div className="row start-xs middle-xs" style={{ marginTop: 20, marginLeft: 0 }}>
          <img src={user.picture} style={{ width: 96, height: 96, marginRight: 15 }} />
          <RaisedButton label={this.props.intl.formatMessage(messages.uploadProfilePicture)}
                        onTouchTap={() => this.handleProfilePictureUpload()}
          />
        </div>

        <div style={styles.fieldLabel}>{this.props.intl.formatMessage(messages.name)}</div>
        <TextField
          defaultValue={user.name || ''}
          onChange={e => this.handleNameChange(e.target['value'])}
        />

        <div style={{ marginTop: 30 }}>
          <RaisedButton label={this.props.intl.formatMessage(messages.updateProfile)}
                        secondary={true}
                        onTouchTap={() => this.handleSubmit()}
                        disabled={!this.hasNameChanged() || isRunning(this.props.submitProfileUpdate)}
          />
        </div>
      </Wrapper>
    );
  }
}

export default SettingsHandler;
