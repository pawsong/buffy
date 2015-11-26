import React from 'react';
import IconMenu from './icon-menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import RootIcon from './RootIcon';
import NotImplDialog from './NotImplDialog';

const WindowIconMenu = React.createClass({
  render() {
    return <div style={{ display: 'inline-block' }}>
      <IconMenu {...this.props} iconButtonElement={ <RootIcon>Window</RootIcon> }>
        <MenuItem primaryText="Toggle fullscreen" onTouchTap={this._toggleFullscreen}/>
      </IconMenu>
    </div>
  },
});

export default WindowIconMenu;
