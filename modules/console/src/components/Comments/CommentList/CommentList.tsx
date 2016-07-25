import React from 'react';
import { Link } from 'react-router';
import withStyles from 'isomorphic-style-loader/lib/withStyles';
const pure = require('recompose/pure').default;
import { FormattedRelative } from 'react-intl';
import {Editor, EditorState, ContentState} from 'draft-js';

const anonProfilePicture = require('file!../../../ic_pets_black_24dp_2x.png');
const styles = require('./CommentList.css');

import CommentForm from '../CommentForm';

import { CommentDocument } from '../types';

interface CommentListProps {
  userId: string;
  comments: CommentDocument[];
  editingComment: string;
  disabled: boolean;
  onCommentRequestEdit: (commentId: string) => any;
  onCommentUpdate: (commentId: string, version: number, body: string) => any;
  onCommentDelete: (commentId: string) => any;
}

interface CommentListState {
  editingComment?: string;
}

@pure
@withStyles(styles)
class CommentList extends React.Component<CommentListProps, void> {
  handleEditCancel = () => this.props.onCommentRequestEdit('');

  render() {
    return (
      <div className={styles.root}>
        {this.props.comments.map(comment => {
          const picture = comment.user.picture ? `${__CDN_BASE__}/${comment.user.picture}` : anonProfilePicture;
          const profileUrl = `/@${comment.user.username}`;

          const menu = comment.user.id === this.props.userId
            ? (
              <div className={styles.menu}>
                <span
                  className={styles.menuItem}
                  onClick={() => this.props.onCommentRequestEdit(comment.id)}
                >
                  edit
                </span>
                <span
                  className={styles.menuItem}
                  onClick={() => this.props.onCommentDelete(comment.id)}
                >
                  delete
                </span>
              </div>
            ) : null;

          const body = this.props.editingComment === comment.id
            ? (
              <CommentFormContainer
                initialState={comment.body}
                onCancel={this.handleEditCancel}
                onSubmit={body => this.props.onCommentUpdate(comment.id, comment.__v, body)}
                disabled={this.props.disabled}
              />
            )
            : (
              <div>{comment.body}</div>
            );

          return (
            <div key={comment.id} className={styles.item}>
              <Link to={profileUrl}><img src={picture} /></Link>
              <div className={styles.content}>
                <div className={styles.header}>
                  <div>
                    <Link to={profileUrl}>{comment.user.username}</Link>
                    <span className={styles.date}><FormattedRelative value={Date.parse(comment.createdAt)} /></span>
                  </div>
                  {menu}
                </div>
                <div className={styles.body}>{body}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

interface CommentFormContainerProps {
  initialState: string;
  onSubmit: (body: string) => any;
  onCancel: () => any;
  disabled: boolean;
}

interface CommentFormContainerState {
  editorState?: EditorState;
}

function createEditorStateFromText(text: string) {
  return EditorState.createWithContent(ContentState.createFromText(text));
}

class CommentFormContainer extends React.Component<CommentFormContainerProps, CommentFormContainerState> {
  constructor(props: CommentFormContainerProps) {
    super(props);
    this.state = {
      editorState: createEditorStateFromText(props.initialState),
    };
  }

  handleSubmit = () => this.props.onSubmit(this.state.editorState.getCurrentContent().getPlainText());

  render() {
    return (
      <CommentForm
        state={this.state.editorState}
        buttonLabel={'Update'}
        placeholder={''}
        onChange={(editorState) => this.setState({ editorState })}
        onSubmit={this.handleSubmit}
        disabled={this.props.disabled}
        onCancel={this.props.onCancel}
      />
    );
  }
}

export default CommentList;
