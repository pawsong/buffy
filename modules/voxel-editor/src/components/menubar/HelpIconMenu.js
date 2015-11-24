import React from 'react';
import IconMenu from './icon-menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import RootIcon from './RootIcon';
import NotImplDialog from './NotImplDialog';

const HelpIconMenu = React.createClass({
  getInitialState() {
    return {
      showNotImplDialog: false,
    };
  },

  render() {
    return <div style={{ display: 'inline-block' }}>
      <IconMenu {...this.props} iconButtonElement={ <RootIcon>Help</RootIcon> }>
        <MenuItem primaryText="Report a problem"
          onTouchTap={() => this.setState({ showNotImplDialog: true })}/>
      </IconMenu>
      <NotImplDialog
        open={this.state.showNotImplDialog}
        onRequestClose={() => this.setState({ showNotImplDialog: false })}
      />
    </div>
  },
});

export default HelpIconMenu;
