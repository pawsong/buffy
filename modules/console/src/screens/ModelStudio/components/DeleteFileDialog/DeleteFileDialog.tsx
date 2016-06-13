import * as React from 'react';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import { ModelFile } from '../../types';

interface DeleteFileDialogProps {
  fileToDelete: ModelFile;
  disabled: boolean;
  onDeleteCancel: () => any;
  onDeleteConfirm: () => any;
}

function renderBody(file: ModelFile) {
  return (
    <div>
      Are you sure to delete <span style={{ fontWeight: 'bold' }}>{file.name || '(Untitled)'}</span>?
      Deleted files cannot be recovered.
    </div>
  );
}

const DeleteFileDialog: React.StatelessComponent<DeleteFileDialogProps> = props => {
  const actions = [
    <FlatButton
      label="Cancel"
      disabled={props.disabled}
      primary={true}
      onTouchTap={props.onDeleteCancel}
    />,
    <FlatButton
      label="OK"
      disabled={props.disabled}
      primary={true}
      keyboardFocused={true}
      onTouchTap={props.onDeleteConfirm}
    />,
  ];

  const body = props.fileToDelete ? renderBody(props.fileToDelete) : null;

  return (
    <Dialog
      title="Delete File"
      actions={actions}
      modal={props.disabled}
      open={!!props.fileToDelete}
      onRequestClose={props.onDeleteCancel}
    >
      {body}
    </Dialog>
  );
}

export default DeleteFileDialog;
