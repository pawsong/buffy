import React from 'react';
import MenuItem from 'material-ui/lib/menus/menu-item';
import ArrowDropRight from 'material-ui/lib/svg-icons/navigation-arrow-drop-right';

import IconMenu from './icon-menu';
import RootIcon from './RootIcon';
import NotImplDialog from './NotImplDialog';
import FileBrowserDialog from './FileBrowserDialog';

const FileIconMenu = React.createClass({
  getInitialState() {
    return {
      showNotImplDialog: false,
      showFileBrowserDialog: false,
    };
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
          onTouchTap={() => this.setState({ showNotImplDialog: true })}/>

        <MenuItem primaryText="Submit" secondaryText="⌘S"
          onTouchTap={() => this.setState({ showNotImplDialog: true })}/>
      </IconMenu>
      <FileBrowserDialog
        open={this.state.showFileBrowserDialog}
        onRequestClose={() => this.setState({ showFileBrowserDialog: false })}
      />
      <NotImplDialog
        open={this.state.showNotImplDialog}
        onRequestClose={() => this.setState({ showNotImplDialog: false })}
      />
    </div>
  },
});

export default FileIconMenu;
