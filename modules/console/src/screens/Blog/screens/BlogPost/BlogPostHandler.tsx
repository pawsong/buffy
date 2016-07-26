import React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps, Link} from 'react-router';
import {replace} from 'react-router-redux';
const ReactMarkdown = require('react-markdown');
import withStyles from 'isomorphic-style-loader/lib/withStyles';
import { FormattedDate } from 'react-intl';
import {EditorState} from 'draft-js';
import { createSelector } from 'reselect';

const removeMd = require('remove-markdown');

import {
  EnhancedTitle,
  Meta,
  MetaDescription,
} from '../../../../hairdresser';

import {BlogPostDocument} from '../../types';

import { preloadApi, connectApi, ApiCall, get } from '../../../../api';

import { call } from 'redux-saga/effects';
import { saga, SagaProps, ImmutableTask, isDone, isRunning, request, wait } from '../../../../saga';

import Comments, {CommentDocument} from '../../../../components/Comments';

const anonProfilePicture = require('file!../../../../ic_pets_black_24dp_2x.png');
const styles = require('./BlogPostHandler.css');

import { User } from '../../../../reducers/users';

interface RouteParams {
  slug: string;
}

interface HandlerProps extends RouteComponentProps<RouteParams, RouteParams>, SagaProps {
  post: ApiCall<BlogPostDocument>;
  addComment?: ImmutableTask<any>;
  updateComment?: ImmutableTask<any>;
  deleteComment?: ImmutableTask<any>;
  loadComments?: ImmutableTask<any>;
  user?: User;
}

interface HandleState {
  comments?: CommentDocument[];
  commentFormState?: EditorState;
  editingComment?: string;
}

const descriptionSelector = createSelector(
  (props: HandlerProps) => props.post.result,
  post => {
    if (!post) return '';
    const plainText = removeMd(post.body);
    return plainText.length > 300 ? `${plainText.substr(0, 300)}...` : plainText;
  }
);

@preloadApi<RouteParams>(params => ({
  post: get(`${CONFIG_API_SERVER_URL}/blog-posts/${params.slug}`),
}))
@connectApi(null, state => ({
  user: state.users.get(state.auth.userid),
}))
@saga({
  loadComments: function* (postId: string, before: string = '', callback: (comments: CommentDocument[]) => any) {
    const response = yield call(request.get, `${CONFIG_API_SERVER_URL}/blog-posts/${postId}/comments?before=${before}`);
    if (response.status !== 200) {
      // TODO: Error handling
      return null;
    }

    callback(response.data);
  },
  addComment: function* (postId: string, body: string, callback: (comment: CommentDocument) => any) {
    const response = yield call(request.post, `${CONFIG_API_SERVER_URL}/blog-posts/${postId}/comments`, { body });
    if (response.status !== 200) {
      // TODO: Error handling
      return null;
    }

    callback(response.data);
  },
  updateComment: function* (
    postId: string, commentId: string, version: number, body: string, callback: (comment: CommentDocument) => any
  ) {
    const response = yield call(request.put, `${CONFIG_API_SERVER_URL}/blog-posts/${postId}/comments/${commentId}/${version}`, {
      body,
    });
    if (response.status !== 200) {
      // TODO: Error handling
      return null;
    }

    callback(response.data);
  },
  deleteComment: function* (postId: string, commentId: string, callback: () => any) {
    const response = yield call(request.del, `${CONFIG_API_SERVER_URL}/blog-posts/${postId}/comments/${commentId}`);
    if (response.status !== 200) {
      // TODO: Error handling
      return null;
    }

    callback();
  },
})
@withStyles(styles)
class BlogPostHandler extends React.Component<HandlerProps, HandleState> {
  constructor(props: HandlerProps) {
    super(props);
    this.state = {
      commentFormState: EditorState.createEmpty(),
      comments: [],
      editingComment: '',
    };
  }

  handleLoadMoreComments = (before: string = '') => {
    const post = this.props.post.result;
    if (!post) return;

    this.props.runSaga(this.props.loadComments, post.id, before, (comments: CommentDocument[]) => {
      this.setState({ comments: this.state.comments.concat(comments) });
    });
  }

  handleCommentAdd = (text: string) => {
    const post = this.props.post.result;
    if (!post) return;

    this.props.runSaga(this.props.addComment, post.id, text, (comment) => {
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
    const post = this.props.post.result;
    if (!post) return;

    this.props.runSaga(this.props.updateComment, post.id, commentId, version, body, comment => {
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
    const post = this.props.post.result;
    if (!post) return;

    this.props.runSaga(this.props.deleteComment, post.id, commentId, () => {
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
    const post = this.props.post.result;
    if (!post) return null;

    const description = descriptionSelector(this.props);
    const picture = post.author.picture ? `${__CDN_BASE__}/${post.author.picture}` : anonProfilePicture;

    return (
      <div>
        <EnhancedTitle>{post.title}</EnhancedTitle>
        <MetaDescription>{description}</MetaDescription>
        <h1 className={styles.title}>
          {post.title}
        </h1>
        <div className={styles.profile}>
          <FormattedDate
            value={new Date(post.createdAt)}
            year='numeric'
            month='short'
            day='numeric'
          />
          <Link to={`/@${post.author.username}`} className={styles.profilePicture}>
            <img src={picture} />
          </Link>
          <Link to={`/@${post.author.username}`} className={styles.profileUsername}>
            {post.author.username}
          </Link>
        </div>
        <ReactMarkdown
          className={styles.body}
          source={post.body}
          renderers={{Link: props => <a href={props.href} target="_blank">{props.children}</a>}}
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

export default BlogPostHandler;
