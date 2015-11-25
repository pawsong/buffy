import React from 'react';
import MenuItem from 'material-ui/lib/menus/menu-item';
import ArrowDropRight from 'material-ui/lib/svg-icons/navigation-arrow-drop-right';

import IconMenu from './icon-menu';
import RootIcon from './RootIcon';
import NotImplDialog from './NotImplDialog';
import FileBrowserDialog from './FileBrowserDialog';
import SaveDialog from './SaveDialog';
import config from '@pasta/config-public';

const FileIconMenu = React.createClass({
  getInitialState() {
    return {
      showNotImplDialog: false,
      showSaveDialog: false,
      showFileBrowserDialog: false,
    };
  },

  _onSave() {
    const { workspace } = this.props;
    const { name } = workspace;
    if (!name) {
      return this.setState({ showSaveDialog: true });
    }
    const data = { a: 1 };

    const voxels = this.props.voxel.toJSON();
    const sprites = this.props.sprite.toJSON();

    fetch(`${config.apiServerUrl}/voxel-workspaces/me/${name}`, {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        data: JSON.stringify({
          voxels,
          sprites,
        }),
      }),
    });
  },

  _onSaveDialogClose(result) {
    this.setState({ showSaveDialog: false });
    if (result) { this._onSave(); }
  },

  render() {
    return <div style={{ display: 'inline-block' }}>
      <IconMenu {...this.props} width={192} iconButtonElement={ <RootIcon>File</RootIcon> }>
        <IconMenu iconButtonElement={
          <MenuItem primaryText="New" rightIcon={<ArrowDropRight />} />
          }>
          <MenuItem primaryText="Object"
            onTouchTap={() => this.setState({ showNotImplDialog: true })}/>
        </IconMenu>

        <MenuItem primaryText="Open" secondaryText="⌘O"
          onTouchTap={() => this.setState({ showFileBrowserDialog: true })}/>

        <MenuItem primaryText="Save" secondaryText="⌘S"
          onTouchTap={this._onSave}/>

        <MenuItem primaryText="Submit" secondaryText="⌘S"
          onTouchTap={() => this.setState({ showNotImplDialog: true })}/>
      </IconMenu>

      <FileBrowserDialog
        open={this.state.showFileBrowserDialog}
        actions={this.props.actions}
        onRequestClose={() => this.setState({ showFileBrowserDialog: false })}
      />
      <SaveDialog
        open={this.state.showSaveDialog}
        actions={this.props.actions}
        onRequestClose={this._onSaveDialogClose}
      />
      <NotImplDialog
        open={this.state.showNotImplDialog}
        onRequestClose={() => this.setState({ showNotImplDialog: false })}
      />
    </div>
  },
});

export default FileIconMenu;
