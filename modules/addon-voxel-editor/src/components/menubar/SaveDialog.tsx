import * as React from 'react';
import Dialog = require('material-ui/lib/dialog');
import TextField = require('material-ui/lib/text-field');
import FlatButton = require('material-ui/lib/flat-button');

export interface SaveDialogProps extends React.Props<SaveDialog> {
  open: boolean;
  actions: any;
  onRequestClose: (buttonClicked: boolean) => void;
}

export class SaveDialog extends React.Component<SaveDialogProps, {
  name: string;
}> {
  constructor(props) {
    super(props);
    this.state = { name: '' };
  };

  _onTextChange(e) {
    this.setState({ name: e.target.value });
  };

  _onDialogSubmit() {
    const { name } = this.state;
    fetch(`${CONFIG_API_SERVER_URL}/voxel-workspaces/me/${name}`, {
      method: 'post',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name }),
    }).then(response => {
      return response.json();
    }).then(response => {
      this.props.actions.setWorkspace(response);
      this.props.onRequestClose(true);
    });
  };

  render() {
    const actions = [
      <FlatButton
        label="Cancel"
        onTouchTap={() => { this.props.onRequestClose(false); }} />,
      <FlatButton
        label="Submit"
        onTouchTap={this._onDialogSubmit.bind(this)} />,
    ];
    return <Dialog
      open={this.props.open}
      title="Set name of your workspace"
      actions={actions}
      >
      <TextField hintText="Hint Text" onChange={this._onTextChange.bind(this)}/>
    </Dialog>
  };
};

export default SaveDialog;
