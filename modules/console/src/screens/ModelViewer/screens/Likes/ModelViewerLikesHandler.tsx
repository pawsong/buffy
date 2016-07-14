import React from 'react';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { RouteComponentProps, Link } from 'react-router';
import Paper from 'material-ui/Paper';

import { User } from '../../../../reducers/users';
const styles = require('./ModelViewerLikesHandler.css');
import { call } from 'redux-saga/effects';
import { saga, SagaProps, ImmutableTask, isRunning, request } from '../../../../saga';

import UserPaper from './components/UserPaper';

const Waypoint = require('react-waypoint');

const anonProfilePicture = require('file!../../../../ic_pets_black_24dp_2x.png');

interface LikeDocument {
  id: string;
  user: User;
  createdAt: Date;
}

interface RouteParams {
  modelId: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams>, SagaProps {
  loadMoreLikes?: ImmutableTask<any>;
}

interface HandlerState {
  likes?: LikeDocument[];
}

@saga({
  loadMoreLikes: function* (modelId: string, before: string = '', callback: (likes: LikeDocument[]) => any) {
    const response = yield call(request.get, `${CONFIG_API_SERVER_URL}/files/${modelId}/likes?before=${before}`);

    if (response.status !== 200) {
      // TODO: Error handling
      return null;
    }

    const likes = response.data;
    callback(likes);
  },
})
@withStyles(styles)
class ModelViewerLikesHandler extends React.Component<HandlerProps, HandlerState> {
  constructor(props) {
    super(props);
    this.state = {
      likes: [],
    };
  }

  handleLoadMore = () => {
    const lastLike = this.state.likes[this.state.likes.length - 1];
    this.props.runSaga(this.props.loadMoreLikes, this.props.params.modelId, lastLike && lastLike.createdAt, (likes) => {
      this.setState({ likes: this.state.likes.concat(likes) });
    });
  }

  renderLikes() {
    return this.state.likes.map(like => {
      const picture = like.user.picture ? `${__CDN_BASE__}/${like.user.picture}` : anonProfilePicture;
      const profileUrl = `/@${like.user.username}`;

      return (
        <Link key={like.id} to={`/@${like.user.username}`} style={{ textDecoration: 'none' }}>
          <UserPaper
            title={`@${like.user.username}`}
            picture={picture}
          />
        </Link>
      );
    });
  }

  render() {
    return (
      <div>
        <h2 className={styles.title}>
          People who like this model
        </h2>
        <div className={styles.root}>
          {this.renderLikes()}
        </div>
        <Waypoint
          onEnter={this.handleLoadMore}
        />
      </div>
    );
  }
}

export default ModelViewerLikesHandler;
