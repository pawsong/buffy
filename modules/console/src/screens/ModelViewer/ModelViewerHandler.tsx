import * as React from 'react';
import { connect } from 'react-redux';
import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
import { RouteComponentProps, Link } from 'react-router';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import RaisedButton from 'material-ui/RaisedButton';
// import FlatButton from 'material-ui/FlatButton';
const FlatButton = require('material-ui/FlatButton').default;
import { cyan500, cyan200, fullWhite } from 'material-ui/styles/colors';
import { preloadApi, connectApi, ApiCall, get, ApiDispatchProps } from '../../api';
import { call } from 'redux-saga/effects';
import ModeEdit from 'material-ui/svg-icons/editor/mode-edit';
import { saga, SagaProps, ImmutableTask, isDone, request } from '../../saga';
import { deserialize } from '../../components/ModelEditor/utils/serdez';
import { FileState as ModelFileState } from '../../components/ModelEditor/types';
import Fork from '../../components/icons/Fork';
import Heart from '../../components/icons/Heart';
import HeartOutline from '../../components/icons/HeartOutline';
import DualButton from './components/DualButton';
import GoToLoginDialog from './components/GoToLoginDialog';
import { User } from '../../reducers/users';

import { moveToLoginPage } from '../../actions';

import {
  EnhancedTitle,
  MetaImage,
  MetaUrl,
} from '../../hairdresser';

import getForkItemLabel from '../../utils/getForkItemLabel';

const styles = require('./ModelViewerHandler.css');

import {
  ModelFileDocument,
  MaterialMapType,
} from '../../types';

interface RouteParams {
  modelId: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams>, SagaProps, ApiDispatchProps {
  model?: ApiCall<ModelFileDocument>;
  changeLikeStatus?: ImmutableTask<ModelFileState>;
  user?: User;
  like?: ApiCall<{ liked: boolean }>;
  moveToLoginPage?: typeof moveToLoginPage;
  intl?: InjectedIntlProps;
}

interface HandlerState {
  goToLoginDialogOpen?: boolean;
}

const rootClass = [
  'col-xs-12',
  'col-md-offset-2',
  'col-md-8',
].join(' ');

const contentClass = [
  'col-xs-12',
  'col-md-8',
].join(' ');

@preloadApi<RouteParams>((params) => ({
  model: get(`${CONFIG_API_SERVER_URL}/files/${params.modelId}`),
}))
@connectApi<HandlerProps>((state, props) => {
  const user = state.users.get(state.auth.userid);
  return user ? {
    like: get(`${CONFIG_API_SERVER_URL}/files/${props.params.modelId}/likes/${user.username}`),
  } : {};
}, (state) => ({
  user: state.users.get(state.auth.userid),
}), {
  moveToLoginPage,
})
@saga({
  changeLikeStatus: function* (modelId: string, liked: boolean, callback: any) {
    const response = yield call(request.put, `${CONFIG_API_SERVER_URL}/files/${modelId}/likes`, { liked });

    if (response.status !== 200) {
      // TODO: Error handling
      return null;
    }

    callback();
  },
})
@withStyles(styles)
class ModelViewerHandler extends React.Component<HandlerProps, HandlerState> {
  constructor(props) {
    super(props);
    this.state = {
      goToLoginDialogOpen: false,
    }
  }

  reloadLike() {
    if (this.props.like) this.props.request(this.props.like);
  }

  componentDidMount() {
    this.reloadLike();
  }

  componentDidUpdate(prevProps: HandlerProps) {
    if (this.props.location !== prevProps.location) this.reloadLike();
  }

  renderLoading() {
    return (
      <div>Loading...</div>
    );
  }

  checkIfFileLiked() {
    return this.props.like && this.props.like.state === 'fulfilled' && this.props.like.result.liked ? true : false;
  }

  handleLikeButtonClick = () => {
    if (!this.props.user) {
      this.setState({ goToLoginDialogOpen: true });
      return;
    }

    const model = this.props.model.result;

    const liked = this.checkIfFileLiked();
    this.props.runSaga(this.props.changeLikeStatus, model.id, !liked, () => {
      this.props.request(this.props.model);
      this.props.request(this.props.like);
    });
  }

  renderBody(model: ModelFileDocument) {
    const liked = this.checkIfFileLiked();

    if (!model) {
      return this.renderLoading();
    }

    let user = null;
    if (model.owner) {
      user = (
        <div className={styles.fork} style={{ display: 'inline-block', paddingBottom: 0, marginLeft: 5 }}>
          by <Link to={`/@${model.owner.username}`}>{model.owner.username}</Link>
        </div>
      );
    }

    let fork = null;
    if (model.forkParent) {
      fork = (
        <div className={styles.fork}>
          forked from <Link to={`/model/${model.forkParent.id}`}>{getForkItemLabel(model.forkParent)}</Link>
        </div>
      );
    }

    let edit = null;
    if (this.props.user && model.owner && this.props.user.id === model.owner.id) {
      edit = (
        <div className={styles.dualButton} style={{ display: 'inline-block' }}>
          <FlatButton
            backgroundColor={cyan500}
            hoverColor={cyan200}
            style={{color: fullWhite}}
            icon={
              <ModeEdit
                color={fullWhite}
                style={{ width: 18, height: 18 }}
              />
            }
            label={'Edit'}
            containerElement={<Link to={`/model/edit?files=${model.id}`} />}
          />
        </div>
      );
    }

    return (
      <div>
        <div className={styles.title}>
          <div style={{ float: 'right' }}>
            <DualButton
              className={styles.dualButton}
              icon={liked ? <HeartOutline /> : <Heart />}
              leftLabel={liked ? 'unlike' : 'like'}
              leftOnTouchTap={this.handleLikeButtonClick}
              rightLabel={`${model.likeCount}`}
              rightHref={`/model/${model.id}/likes`}
            />
            <DualButton
              className={styles.dualButton}
              icon={<Fork />}
              leftLabel={'fork'}
              leftHref={`/model/edit?files=${model.id}`}
              rightLabel={`${model.forked}`}
              rightOnTouchTap={() => alert('Sorry, this feature is under construction')}
            />
            {edit}
          </div>
          <Link to={`/model/${model.id}`} >
            <h1 style={{ display: 'inline-block' }}>
              {this.props.model.result.name}
            </h1>
          </Link>
          {user}
          {fork}
        </div>
        {this.props.children}
      </div>
    );
  }

  handleGoToLoginDialogRequestClose = () => this.setState({ goToLoginDialogOpen: false });

  handleRequestLoginPage = () => this.props.moveToLoginPage(this.props.location);

  render() {
    const model = this.props.model.result;

    let head = null;
    if (model) {
      const title = model.owner ? `${model.name} by ${model.owner.username}` : model.name;
      head = (
        <div>
          <EnhancedTitle>{title}</EnhancedTitle>
          <MetaImage url={`${__CDN_BASE__}/${model.thumbnail}`} />
        </div>
      );
    }

    return (
      <div className={rootClass}>
        {head}
        <MetaUrl url={`${__BASE__}${this.props.location.pathname}`} />
        {this.renderBody(model)}
        <GoToLoginDialog
          open={this.state.goToLoginDialogOpen}
          onRequestClose={this.handleGoToLoginDialogRequestClose}
          onRequestLoginPage={this.handleRequestLoginPage}
        />
      </div>
    );
  }
}

export default ModelViewerHandler;
