import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { call, put } from 'redux-saga/effects';

import * as Colors from 'material-ui/styles/colors';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import Slider from 'material-ui/Slider';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import Messages from '../../constants/Messages';

import { State } from '../../reducers';
import { User } from '../../reducers/users';
import Wrapper from '../../components/Wrapper';

import { userUpdate } from '../../actions/users';

import { saga, SagaProps, ImmutableTask, isRunning, isDone, request, wait } from '../../saga';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./SettingsHandler.css');

const AvatarEditor = require('react-avatar-editor');

const messages = defineMessages({
  profilePicture: {
    id: 'settings.profile.picture',
    description: 'Profile picture area title',
    defaultMessage: 'Profile picture',
  },
  changeProfilePicture: {
    id: 'settings.change.profile.picture',
    description: 'Change profile picture button label',
    defaultMessage: 'Change your picture',
  },
  uploadProfilePicture: {
    id: 'settings.upload.profile.picture',
    description: 'Upload profile picture button label',
    defaultMessage: 'Upload your picture',
  },
  getImageFromUrl: {
    id: 'settings.get.image.from.url',
    description: 'Get image from URL',
    defaultMessage: 'Get image from URL',
  },
  imageUrl: {
    id: 'settings.image.url',
    description: 'Image URL',
    defaultMessage: 'Image URL',
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

const IMAGE_TYPE = 'image/png';

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
  uploadProfilePicture?: ImmutableTask<boolean>;
  submitProfileUpdate?: ImmutableTask<any>;
}

interface HandlerState {
  name?: string;
  profilePictureUrl?: string;
  profilePictureScale?: number;
}

@saga({
  uploadProfilePicture: function* (userId: string, blob: Blob, type: string) {
    let response;

    response = yield call(request.post, `${CONFIG_API_SERVER_URL}/cdn/signed-url/profile`, {
      contentType: type,
    });

    if (response.status !== 200) {
      // TODO: Error handling
      return;
    }
    const { signedUrl, key, cacheControl } = response.data;

    response = yield call(request.put, signedUrl, blob, {
      headers: {
        'Content-Type': type,
        'Cache-Control': cacheControl,
      },
      withCredentials: false,
    });

    if (response.status !== 200) {
      // TODO: Error handling
      return;
    }

    response = yield call(request.put, `${CONFIG_API_SERVER_URL}/me`, {
      picture: key,
    });

    if (response.status !== 200) {
      // TODO: Error handling
      return;
    }

    yield put(userUpdate(userId, { picture: key }));
  },
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
@(connect((state: State) => ({
  user: state.users.get(state.auth.userid),
})) as any)
@injectIntl
@withStyles(styles)
class SettingsHandler extends React.Component<HandlerProps, HandlerState> {
  fileReader: FileReader;

  constructor(props) {
    super(props);
    this.state = {
      name: '',
      profilePictureUrl: '',
      profilePictureScale: 1,
    };
  }

  handleNameChange(name: string) {
    this.setState({ name });
  }

  hasNameChanged() {
    if (!this.props.user) return false;
    if (!this.state.name) return false;

    return this.props.user.name !== this.state.name;
  }

  handleProfilePictureClick() {
    // Reset dialog state
    this.setState({
      profilePictureUrl: '',
      profilePictureScale: 1,
    });
    this.props.cancelSaga(this.props.uploadProfilePicture);

    const input = findDOMNode(this.refs['fileUpload']);
    const clickEvent = new MouseEvent('click');
    input.dispatchEvent(clickEvent);
  }

  handleProfilePictureDialogClose() {
    this.setState({ profilePictureUrl: '' });
  }

  handleSubmit() {
    if (!this.hasNameChanged()) return;
    this.props.runSaga(this.props.submitProfileUpdate, this.props.user.id, this.state.name);
  }

  dataUriToBlob(dataUri, dataType) {
    const binary = atob(dataUri.split(',')[1])
    const array = [];
    for(let i = 0; i < binary.length; i++) array.push(binary.charCodeAt(i));
    return new Blob([new Uint8Array(array)], { type: dataType });
  }

  handleProfilePictureSubmit() {
    const dataUrl = this.refs['avatar']['getImage'](IMAGE_TYPE);
    const blob = this.dataUriToBlob(dataUrl, IMAGE_TYPE);
    this.props.runSaga(this.props.uploadProfilePicture, this.props.user.id, blob, IMAGE_TYPE);
  }

  componentWillUnmount() {
    if (this.fileReader) this.fileReader.abort();
    this.props.cancelSaga(this.props.uploadProfilePicture);
  }

  renderProfilePictureDialog() {
    const isUploading = isRunning(this.props.uploadProfilePicture);

    const actions = [
      <FlatButton
        label={this.props.intl.formatMessage(Messages.cancel)}
        secondary={true}
        disabled={isUploading}
        onTouchTap={() => this.handleProfilePictureDialogClose()}
      />,
      <FlatButton
        label={this.props.intl.formatMessage(Messages.submit)}
        primary={true}
        disabled={isUploading}
        keyboardFocused={true}
        onTouchTap={() => this.handleProfilePictureSubmit()}
      />,
    ];

    return (
      <Dialog
        title={this.props.intl.formatMessage(messages.changeProfilePicture)}
        actions={actions}
        modal={isUploading}
        open={this.state.profilePictureUrl.length > 0 && !isDone(this.props.uploadProfilePicture)}
        onRequestClose={() => this.handleProfilePictureDialogClose()}
        contentClassName={styles.dialogContent}
      >
        <div style={{ textAlign: 'center' }}>
          <AvatarEditor
            ref="avatar"
            image={this.state.profilePictureUrl}
            width={192}
            height={192}
            border={50}
            color={[192, 192, 192, 0.8]} // RGBA
            scale={this.state.profilePictureScale}
          />
          <Slider
            defaultValue={0.5}
            onChange={(event, value) => this.setState({ profilePictureScale: value * 2 })}
          />
        </div>
      </Dialog>
    );
  }

  handleProfileImageChange(e: React.FormEvent) {
    const file = e.target['files'][0];
    if (!file) return;

    if (this.fileReader) this.fileReader.abort();

    this.fileReader = new FileReader();
    this.fileReader.onload = upload => {
      this.setState({ profilePictureUrl: upload.target['result'] });
    }

    this.fileReader.readAsDataURL(file);
  }

  render() {
    const { user } = this.props;
    if (!user) return null;

    const picture = `${__CDN_BASE__}/${user.picture}`;

    return (
      <Wrapper style={{ marginTop: 15 }}>
        <h1>{this.props.intl.formatMessage(Messages.settings)}</h1>

        <div className={styles.fieldLabel}>{this.props.intl.formatMessage(messages.profilePicture)}</div>
        <div className="row start-xs middle-xs" style={{ marginTop: 20, marginLeft: 0 }}>
          <img src={picture} style={{ width: 96, height: 96, marginRight: 15 }} />
          <RaisedButton label={this.props.intl.formatMessage(messages.changeProfilePicture)}
                        onTouchTap={() => this.handleProfilePictureClick()}
          />
          <input
            ref="fileUpload"
            type="file"
            accept="image/*"
            style={{ display : 'none' }}
            onChange={e => this.handleProfileImageChange(e)}
          />
        </div>

        {this.renderProfilePictureDialog()}

        <div className={styles.fieldLabel}>{this.props.intl.formatMessage(messages.name)}</div>
        <TextField
          id="username"
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
