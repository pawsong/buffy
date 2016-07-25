import React from 'react';
import {EditorState} from 'draft-js';

import CommentForm from './CommentForm';
import CommentList from './CommentList';

const Waypoint = require('react-waypoint');

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./Comments.css');

import { CommentDocument } from './types';

interface CommentsProps {
  userId: string;
  disabled: boolean;
  comments: CommentDocument[];
  commentFormState: EditorState;
  editingComment: string;
  onCommentFormChange: (state: EditorState) => any;
  onEditingCommentChange: (commentId: string) => any;
  onLoadComments: (before: string) => any;
  onAddComment: (body: string) => any;
  onUpdateComment: (commentId: string, version: number, body: string) => any;
  onDeleteComment: (commentId: string) => any;
}

@withStyles(styles)
class Comments extends React.Component<CommentsProps, void> {
  handleCommentFormSubmit = () => {
    const text = this.props.commentFormState.getCurrentContent().getPlainText();
    this.props.onAddComment(text);
  };

  handleLoadMoreComments = () => {
    const lastComment = this.props.comments[this.props.comments.length - 1];
    this.props.onLoadComments(lastComment && lastComment.createdAt);
  }

  render() {
    return (
      <div className={styles.root}>
        <div className={styles.commentsHeader}>
          Comments
        </div>
        <CommentForm
          state={this.props.commentFormState}
          onChange={this.props.onCommentFormChange}
          onSubmit={this.handleCommentFormSubmit}
          buttonLabel={'Comment'}
          placeholder={this.props.userId ? 'Write a comment...' : 'Log in to leave a comment'}
          disabled={!this.props.userId || this.props.disabled}
        />
        <CommentList
          userId={this.props.userId}
          comments={this.props.comments}
          editingComment={this.props.editingComment}
          onCommentRequestEdit={this.props.onEditingCommentChange}
          disabled={this.props.disabled}
          onCommentUpdate={this.props.onUpdateComment}
          onCommentDelete={this.props.onDeleteComment}
        />
        <Waypoint
          onEnter={this.handleLoadMoreComments}
        />
      </div>
    );
  }
}

export default Comments;
