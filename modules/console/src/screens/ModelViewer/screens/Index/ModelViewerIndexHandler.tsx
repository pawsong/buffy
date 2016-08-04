import React from 'react';
import { connect } from 'react-redux';
import { RouteComponentProps, Link } from 'react-router';
import { call } from 'redux-saga/effects';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { saga, SagaProps, ImmutableTask, isDone, isRunning, request, wait } from '../../../../saga';
import { deserialize } from '../../../../components/ModelEditor/utils/serdez';
import { FileState as ModelFileState } from '../../../../components/ModelEditor/types';

import ModelViewer from './components/ModelViewer';
import {EditorState} from 'draft-js';

import { State } from '../../../../reducers';
import { User } from '../../../../reducers/users';

const styles = require('./ModelViewerIndexHandler.css');

import Comments, {CommentDocument} from '../../../../components/Comments';

interface RouteParams {
  modelId: string;
}

interface ModelData {
  model: ModelFileState;
  blockly: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams>, SagaProps {
  addComment?: ImmutableTask<any>;
  updateComment?: ImmutableTask<any>;
  deleteComment?: ImmutableTask<any>;
  loadComments?: ImmutableTask<any>;
  loadModel?: ImmutableTask<ModelData>;
  user?: User;
}

interface HandlerState {
  comments?: CommentDocument[];
  commentFormState?: EditorState;
  editingComment?: string;
}

@saga({
  loadComments: function* (modelId: string, before: string = '', callback: (comments: CommentDocument[]) => any) {
    const response = yield call(request.get, `${CONFIG_API_SERVER_URL}/files/${modelId}/comments?before=${before}`);
    if (response.status !== 200) {
      // TODO: Error handling
      return null;
    }

    callback(response.data);
  },
  addComment: function* (modelId: string, body: string, callback: (comment: CommentDocument) => any) {
    const response = yield call(request.post, `${CONFIG_API_SERVER_URL}/files/${modelId}/comments`, { body });
    if (response.status !== 200) {
      // TODO: Error handling
      return null;
    }

    callback(response.data);
  },
  updateComment: function* (
    modelId: string, commentId: string, version: number, body: string, callback: (comment: CommentDocument) => any
  ) {
    const response = yield call(request.put, `${CONFIG_API_SERVER_URL}/files/${modelId}/comments/${commentId}/${version}`, { body });
    if (response.status !== 200) {
      // TODO: Error handling
      return null;
    }

    callback(response.data);
  },
  deleteComment: function* (modelId: string, commentId: string, callback: () => any) {
    const response = yield call(request.del, `${CONFIG_API_SERVER_URL}/files/${modelId}/comments/${commentId}`);
    if (response.status !== 200) {
      // TODO: Error handling
      return null;
    }

    callback();
  },
  loadModel: function* (modelId) {
    const response = yield call(request.get, `${__S3_BASE__}/files/${modelId}`, {
      responseType: 'arraybuffer',
      withCredentials: false,
    });

    if (response.status !== 200) {
      // TODO: Error handling
      return null;
    }

    return deserialize(new Uint8Array(response.data));
  },
})
@withStyles(styles)
@(connect((state: State) => ({
  user: state.users.get(state.auth.userid),
})) as any)
class ModelViewerIndexHandler extends React.Component<HandlerProps, HandlerState> {
  constructor(props) {
    super(props);
    this.state = {
      commentFormState: EditorState.createEmpty(),
      comments: [],
      editingComment: '',
    };
  }

  loadModel() {
    this.props.runSaga(this.props.loadModel, this.props.params.modelId);
  }

  handleLoadMoreComments = (before: string = '') => {
    this.props.runSaga(this.props.loadComments, this.props.params.modelId, before, (comments: CommentDocument[]) => {
      this.setState({ comments: this.state.comments.concat(comments) });
    });
  }

  componentDidMount() {
    this.loadModel();
  }

  componentWillReceiveProps(nextProps: HandlerProps) {
    if (this.props.location !== nextProps.location) {
      this.props.cancelSaga(this.props.loadModel);

      this.setState({ comments: [] });
      this.props.cancelSaga(this.props.loadComments);
    }
  }

  componentDidUpdate(prevProps: HandlerProps) {
    if (prevProps.location !== this.props.location) {
      this.loadModel();
    }
  }

  renderLoading() {
    return (
      <div>Loading...</div>
    );
  }

  handleCommentAdd = (text: string) => {
    this.props.runSaga(this.props.addComment, this.props.params.modelId, text, (comment) => {
      this.setState({
        commentFormState: EditorState.createEmpty(),
        comments: [comment].concat(this.state.comments),
      });
    });
  };

  getCommentIndex(commentId: string) {
    for (let i = 0, len = this.state.comments.length; i < len; ++i) {
      if (this.state.comments[i].id === commentId) return i;
    }
    return -1;
  }

  handleUpdateComment = (commentId: string, version: number, body: string) => {
    this.props.runSaga(this.props.updateComment, this.props.params.modelId, commentId, version, body, comment => {
      const index = this.getCommentIndex(commentId);
      if (index === -1) return;

      const comments = this.state.comments.slice();
      comments[index] = comment;
      this.setState({
        comments,
        editingComment: '',
      });
    });
  }

  handleDeleteComment = (commentId: string) => {
    this.props.runSaga(this.props.deleteComment, this.props.params.modelId, commentId, () => {
      const index = this.getCommentIndex(commentId);
      if (index === -1) return;

      const comments = this.state.comments.slice();
      comments.splice(index, 1);
      this.setState({ comments });
    });
  }

  handleCommentFormChange = (commentFormState: EditorState) => this.setState({ commentFormState });

  onEditingCommentChange = (editingComment: string) => this.setState({ editingComment })

  render() {
    if (!isDone(this.props.loadModel)) return this.renderLoading();

    const { model, blockly } = this.props.loadModel.result;

    const animateImmediately = !!this.props.location.query['animate'];

    return (
      <div>
        <ModelViewer
          fileState={model}
          blockly={blockly}
          animateImmediately={animateImmediately}
        />
        <Comments
          commentFormState={this.state.commentFormState}
          comments={this.state.comments}
          editingComment={this.state.editingComment}
          userId={this.props.user && this.props.user.id}
          onLoadComments={this.handleLoadMoreComments}
          onAddComment={this.handleCommentAdd}
          onUpdateComment={this.handleUpdateComment}
          onDeleteComment={this.handleDeleteComment}
          onCommentFormChange={this.handleCommentFormChange}
          onEditingCommentChange={this.onEditingCommentChange}
          disabled={isRunning(this.props.addComment, this.props.updateComment)}
        />
        {
          isRunning(this.props.loadComments) && <div>Loading...</div>
        }
      </div>
    );
  }
}

export default ModelViewerIndexHandler;
