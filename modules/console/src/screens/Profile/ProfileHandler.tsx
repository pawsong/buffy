import * as React from 'react';
import { RouteComponentProps, Link } from 'react-router';

import * as Colors from 'material-ui/styles/colors';
import List from 'material-ui/List/List';
import ListItem from 'material-ui/List/ListItem';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import { connectApi, preloadApi, ApiCall, get } from '../../api';

import { ModelFileDocument } from '../../types';

import getForkItemLabel from '../../utils/getForkItemLabel';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./ProfileHandler.css');

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

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams> {
  user?: ApiCall<User>;
  models?: ApiCall<ModelFileDocument[]>;
}

@preloadApi<RouteParams>((params) => ({
  user: get(`${CONFIG_API_SERVER_URL}/users/${params.username}`),
  models: get(`${CONFIG_API_SERVER_URL}/files/@${params.username}`),
}))
@connectApi()
@withStyles(styles)
class ProfileHandler extends React.Component<HandlerProps, {}> {
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
    const models = this.props.models.state !== 'fulfilled' ? [] : this.props.models.result;

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
          </div>
        </div>
      </div>
    );
  }
}

export default ProfileHandler;
