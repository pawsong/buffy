import * as React from 'react';
import { Link } from 'react-router';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import { ModelFile } from '../../types';

interface RemoveFileDialogProps {
  loggedIn: boolean;
  fileToRemove: ModelFile;
  onLogIn: () => any;
  onRemoveCancel: () => any;
  onRemoveConfirm: () => any;
}

function renderWarningForAnonymous(file: ModelFile, onLogIn: () => any) {
  return (
    <div>
      <p>
        Are you sure to remove <span style={{ fontWeight: 'bold' }}>{file.name || '(Untitled)'}</span> from the list?
        <br />
        As you are not logged in, you will not be able to update this file anymore (fork is still possible though).
      </p>
      <p>
        If you want to have your own storage for continuous updates,
        please <a style={{cursor: 'pointer'}} onClick={onLogIn}>log in</a>.
      </p>
    </div>
  );
}

function renderBody(file: ModelFile) {
  return (
    <div>
      <p>
        Are you sure to remove <span style={{ fontWeight: 'bold' }}>{file.name || '(Untitled)'}</span> from the list?
        Unsaved changes will be discarded.
      </p>
    </div>
  );
}

const RemoveFileDialog: React.StatelessComponent<RemoveFileDialogProps> = props => {
  const actions = [
    <FlatButton
      label="Cancel"
      primary={true}
      onTouchTap={props.onRemoveCancel}
    />,
    <FlatButton
      label="OK"
      secondary={true}
      keyboardFocused={true}
      onTouchTap={props.onRemoveConfirm}
    />,
  ];

  const body = props.fileToRemove ? (
    props.loggedIn ? renderBody(props.fileToRemove) : renderWarningForAnonymous(props.fileToRemove, props.onLogIn)
  ) : null;

  return (
    <Dialog
      title="Remove File from List"
      actions={actions}
      open={!!props.fileToRemove}
      onRequestClose={props.onRemoveCancel}
    >
      {body}
    </Dialog>
  );
}

export default RemoveFileDialog;
