import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import Divider from 'material-ui/Divider';
import FlatButton from 'material-ui/FlatButton';
import { RadioButton, RadioButtonGroup } from 'material-ui/RadioButton';
import FontIcon from 'material-ui/FontIcon';
import withStyles from 'isomorphic-style-loader/lib/withStyles';

import { User } from '../../../../reducers/users';
import ModelEditor from '../../../../components/ModelEditor';
import { ModelFile } from '../../types';
import { saga, SagaProps, ImmutableTask, wait, isRunning } from '../../../../saga';

import ThumbnailFactory from '../../../../canvas/ThumbnailFactory';

import { createFile } from '../../sagas';

const styles = require('./SaveDialog.css');

const MAX_FILE_NAME = 50;

const inlineStyles = {
  block: {
    maxWidth: 250,
  },
  radioButton: {
    marginBottom: 16,
  },
  thumbnail: {
    width: 180,
    height: 180,
    margin: 10,
  },
};

interface SaveDialogProps extends SagaProps {
  thumbnailFactory: ThumbnailFactory;
  user: User;
  file: ModelFile;
  onRequestClose: (fileId: string) => any;
  onSaveDone: (fileId: string, name: string) => any;
  createFile?: ImmutableTask<any>;
}

const VISIBILITY_PUBLIC = 'visibility_public';
const VISIBILITY_PRIVATE = 'visibility_private';

interface SaveDialogState {
  filename?: string;
  visibility?: string;
  filenameErrorText?: string;
}

const THUMBNAIL_SIZE = 180;
const THUMBNAIL_MARGIN = 10;
const THUMBNAIL_CONTAINER_SIZE = THUMBNAIL_SIZE + 2 * THUMBNAIL_MARGIN;

@withStyles(styles)
@saga({
  createFile,
})
class SaveDialog extends React.Component<SaveDialogProps, SaveDialogState> {
  shouldValidateOnChanage: boolean;

  isSaving() {
    return false;
  }

  constructor(props) {
    super(props);

    this.shouldValidateOnChanage = false;

    this.state = {
      filename: '',
      filenameErrorText: '',
    };
  }

  componentWillReceiveProps(nextProps: SaveDialogProps) {
    if (nextProps.file && this.props.file !== nextProps.file) {
      this.setState({
        filename: nextProps.file.name,
        visibility: VISIBILITY_PUBLIC,
        filenameErrorText: '',
      });
    }
  }

  handleRequestClose = () => {
    if (!this.props.file) return;
    this.props.onRequestClose(this.props.file.id);
  }

  handleFileNameChange = (e: any) => {
    this.setState({ filename: e.target.value }, () => {
      if (this.shouldValidateOnChanage) this.validateFilename();
    });
  }

  handleVisibilityChange = (e, value: string) => {
    this.setState({ visibility: value });
  }

  renderBody(disabled: boolean) {
    if (!this.props.file) return null;

    return (
      <div className={styles.body}>
        <div style={inlineStyles.thumbnail}>
          <img width="100%" height="100%" src={this.props.file.thumbnail} />
        </div>
        <div className={styles.form}>
          <TextField
            disabled={disabled}
            style={{ marginBottom: 10 }}
            value={this.state.filename}
            onChange={this.handleFileNameChange}
            floatingLabelText="File name"
            errorText={this.state.filenameErrorText}
          />
          <RadioButtonGroup
            name="visibility"
            style={{ marginTop: 15 }}
            valueSelected={this.state.visibility}
            onChange={this.handleVisibilityChange}
          >
            <RadioButton
              disabled={disabled}
              value={VISIBILITY_PUBLIC}
              label={
                <div>
                  <div className={styles.visibilityOptionLabel}>
                    <FontIcon className="material-icons" style={{ color: 'inherit' }}>public</FontIcon>
                    <span className={styles.visibilityOptionLabelText}>Public</span>
                  </div>
                  <div className={styles.visibilityOptionDesc}>
                    <span>Anyone can see this file. The file is licensed under </span>
                    <a target="_blank" href="http://choosealicense.com/licenses/cc-by-4.0/">cc-by-4.0</a>
                  </div>
                </div>
              }
              style={inlineStyles.radioButton}
            />
            <RadioButton
              disabled={disabled || !this.props.user}
              value={VISIBILITY_PRIVATE}
              label={
                <div>
                  <div className={styles.visibilityOptionLabel}>
                    <FontIcon className="material-icons" style={{ color: 'inherit' }}>lock_outline</FontIcon>
                    <span className={styles.visibilityOptionLabelText}>Private</span>
                  </div>
                  <div className={styles.visibilityOptionDesc}>
                    Only you can see this file. {!this.props.user ? <span>(Logged in users only)</span> : null}
                  </div>
                </div>
              }
              style={inlineStyles.radioButton}
            />
          </RadioButtonGroup>
        </div>
      </div>
    );
  }

  validateFilename(): boolean {
    if (!this.state.filename) {
      this.setState({ filenameErrorText: 'File name is required' });
      return false;
    } else if (this.state.filename.length > MAX_FILE_NAME) {
      this.setState({ filenameErrorText: 'File name must not be longer than {maximum} characters', });
      return false;
    } else {
      if (this.state.filenameErrorText) this.setState({ filenameErrorText: '' });
      return true;
    }
  }

  validate() {
    let result = true;
    result = result && this.validateFilename();
    return result;
  }

  handleSubmit = () => {
    this.shouldValidateOnChanage = true;
    if (!this.validate()) return;

    const params = {
      id: this.props.file.id,
      name: this.state.filename,
      body: this.props.file.body,
    };

    this.props.runSaga(this.props.createFile,
      this.props.thumbnailFactory, params, () => this.props.onSaveDone(params.id, params.name)
    );
  }

  render() {
    const saveIsRunning = isRunning(this.props.createFile);

    const actions = [
      <FlatButton
        label="Cancel"
        disabled={saveIsRunning}
        primary={true}
        onTouchTap={this.handleRequestClose}
      />,
      <FlatButton
        label="Submit"
        disabled={saveIsRunning}
        secondary={true}
        keyboardFocused={true}
        onTouchTap={this.handleSubmit}
      />,
    ];

    return (
      <Dialog
        title={'Save a new file'}
        open={!!this.props.file}
        onRequestClose={this.handleRequestClose}
        modal={saveIsRunning}
        actions={actions}
      >
        {this.renderBody(saveIsRunning)}
      </Dialog>
    );
  }
}

export default SaveDialog;
