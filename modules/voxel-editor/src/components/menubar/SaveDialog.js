import React from 'react';
import Dialog from 'material-ui/lib/dialog';
import TextField from 'material-ui/lib/text-field';
import config from '@pasta/config-public';

const SaveDialog = React.createClass({
  getInitialState() {
    return { name: '' };
  },

  _onTextChange(e) {
    this.setState({ name: e.target.value });
  },

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
  },

  render() {
    return <Dialog
      {...this.props}
      title="Set name of your workspace"
      actions={[
        { text: 'Cancel', onTouchTap: this.props.onRequestClose },
        { text: 'Submit', onTouchTap: this._onDialogSubmit, ref: 'submit' },
      ]}
      actionFocus="submit">
      <TextField hintText="Hint Text" onChange={this._onTextChange}/>
    </Dialog>
  },
});

export default SaveDialog;
