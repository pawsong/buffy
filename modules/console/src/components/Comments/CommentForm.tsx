import React from 'react';
import FlatButton from 'material-ui/FlatButton';
import TextField from 'material-ui/TextField';
// import ClearFix from 'material-ui/internal/ClearFix';
const ClearFix = require('material-ui/internal/ClearFix').default;
import {Editor, EditorState} from 'draft-js';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./CommentForm.css');

interface CommentFormProps {
  placeholder: string;
  state: EditorState;
  disabled: boolean;
  buttonLabel: string;
  onChange: (nextState: EditorState) => any;
  onSubmit: () => any;
  onCancel?: () => any;
}

@withStyles(styles)
class CommentForm extends React.Component<CommentFormProps, void> {
  handleChange = (e: React.FormEvent) => this.props.onChange(e.target['value']);

  handleSubmit = () => this.props.onSubmit();

  render() {
    const empty = !this.props.state.getCurrentContent().hasText();

    return (
      <ClearFix>
        <div className={styles.editor}>
          <Editor
            editorState={this.props.state}
            onChange={this.props.onChange}
            placeholder={this.props.placeholder}
            readOnly={this.props.disabled}
          />
        </div>
        <div style={{ float: 'right' }}>
          {this.props.onCancel && <FlatButton
            label={'Cancel'}
            onTouchTap={this.props.onCancel}
            secondary={true}
            disabled={this.props.disabled}
          />}
          <FlatButton
            label={this.props.buttonLabel}
            onTouchTap={this.props.onSubmit}
            primary={true}
            disabled={empty || this.props.disabled}
          />
        </div>
      </ClearFix>
    );
  }
}

export default CommentForm;
