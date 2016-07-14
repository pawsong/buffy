import * as React from 'react';
import { RouteComponentProps, Link } from 'react-router';
import { call } from 'redux-saga/effects';

import * as Colors from 'material-ui/styles/colors';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import { connectApi, preloadApi, ApiCall, get } from '../../api';

import { ModelFileDocument } from '../../types';

import getForkItemLabel from '../../utils/getForkItemLabel';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./ProfileHandler.css');

const Waypoint = require('react-waypoint');
import { saga, SagaProps, ImmutableTask, isRunning, request } from '../../saga';

const anonProfilePicture = require('file!../../ic_pets_black_24dp_2x.png');

const messages = defineMessages({
  recentModels: {
    id: 'profile.recent.models',
    description: 'Recent models',
    defaultMessage: 'Recent Models',
  },
});

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
].join(' ');

interface RouteParams {
  username: string;
}

interface User {
  id: string;
  username: string;
  name: string;
  picture: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams>, SagaProps {
  user?: ApiCall<User>;
  models?: ApiCall<ModelFileDocument[]>;
  loadMoreFiles?: ImmutableTask<any>;
}

interface HandlerState {
  models?: ModelFileDocument[];
}

@preloadApi<RouteParams>((params) => ({
  user: get(`${CONFIG_API_SERVER_URL}/users/${params.username}`),
  models: get(`${CONFIG_API_SERVER_URL}/files/@${params.username}`),
}))
@connectApi()
@saga({
  loadMoreFiles: function* (username: string, before: string = '', callback: (models: any[]) => any) {
    const response = yield call(request.get, `${CONFIG_API_SERVER_URL}/files/@${username}?before=${before || ''}`);
    if (response.status !== 200) {
      // TODO: Error handling
      return;
    }
    callback(response.data);
  },
})
@withStyles(styles)
class ProfileHandler extends React.Component<HandlerProps, HandlerState> {
  constructor(props) {
    super(props);
    this.state = {
      models: [],
    };
  }

  getModels() {
    return (this.props.models.state !== 'fulfilled' ? [] : this.props.models.result).concat(this.state.models);
  }

  renderUserInfo() {
    if (this.props.user.state !== 'fulfilled') return null;
    const user = this.props.user.result;
    const picture = user.picture ? `${__CDN_BASE__}/${user.picture}` : anonProfilePicture;

    return (
      <div style={{ margin: '20px 10px' }}>
        <div style={{ textAlign: 'center' }}>
          <img src={picture} style={{ width: '100%' }} />
        </div>
        <div className={styles.nameContainer}>
          <div className={styles.name}>{user.name}</div>
          <div className={styles.username}>@{user.username}</div>
        </div>
      </div>
    );
  }

  renderModelList() {
    const models = this.getModels();

    const listBody = models.map(file => {
      const fork = file.forkParent ? (
        <div className={styles.fileForkInfo}>
          forked from <Link to={`/model/${file.forkParent.id}`}>{getForkItemLabel(file.forkParent)}</Link>
        </div>
      ) : null;

      return (
        <div key={file.id} className={styles.fileContainer}>
          <Link to={`/model/${file.id}`}>
            <img src={`${__CDN_BASE__}/${file.thumbnail}`} className={styles.fileThumbnail} />
          </Link>
          <div className={styles.fileInfo} >
            <div>
              <Link to={`/model/${file.id}`}><h2>{file.name}</h2></Link>
              {fork}
            </div>
          </div>
        </div>
      );
    });

    return (
      <div>{listBody}</div>
    );
  }

  handleLoadMore = () => {
    if (this.props.user.state !== 'fulfilled') return;
    if (this.props.models.state !== 'fulfilled') return;

    const user = this.props.user.result;
    const models = this.getModels();
    const lastModel = models[models.length - 1];

    this.props.runSaga(this.props.loadMoreFiles, user.username, lastModel && lastModel.modifiedAt, (files: any) => {
      this.setState({ models: this.state.models.concat(files) });
    });
  }

  render() {
    const userInfo = this.renderUserInfo();
    const modelList = this.renderModelList();

    return (
      <div className={rootClass} style={{ marginTop: 30 }}>
        <div className="row">
          <div className="col-md-3">
            {userInfo}
          </div>
          <div className="col-md-9">
            <FormattedMessage tagName="h2" {...messages.recentModels} />
            <div>{modelList}</div>
            <Waypoint
              onEnter={this.handleLoadMore}
            />
            {
              isRunning(this.props.loadMoreFiles) && <div>Loading...</div>
            }
          </div>
        </div>
      </div>
    );
  }
}

export default ProfileHandler;
