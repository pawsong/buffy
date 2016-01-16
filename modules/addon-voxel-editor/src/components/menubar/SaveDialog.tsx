import * as React from 'react';
import Dialog = require('material-ui/lib/dialog');
import TextField = require('material-ui/lib/text-field');
import config from '@pasta/config-public';

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
    fetch(`${config.apiServerUrl}/voxel-workspaces/me/${name}`, {
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
    return <Dialog
      open={this.props.open}
      title="Set name of your workspace"
      actions={[
        { text: 'Cancel', onTouchTap: this.props.onRequestClose.bind(this) },
        { text: 'Submit', onTouchTap: this._onDialogSubmit.bind(this), ref: 'submit' },
      ]}
      actionFocus="submit">
      <TextField hintText="Hint Text" onChange={this._onTextChange.bind(this)}/>
    </Dialog>
  };
};

export default SaveDialog;
