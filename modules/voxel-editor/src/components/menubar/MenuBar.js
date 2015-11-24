import React from 'react';
import IconMenuContainer from './IconMenuContainer';

import FileIconMenu from './FileIconMenu';
import EditIconMenu from './EditIconMenu';
import WindowIconMenu from './WindowIconMenu';
import HelpIconMenu from './HelpIconMenu';

const MenuBarContent = React.createClass({
  mixins: [IconMenuContainer],
  render() {
    const children = this.bindChildren();
    return <div style={this.props.style}>{children}</div>;
  },
});

const MenuBar = React.createClass({
  render() {
    return <div>
      <MenuBarContent iconMenuStyle={{ display: 'inline-block' }} iconMenuMenuStyle={{
        top: null, left: 0,
      }} style={{ paddingLeft: 5, backgroundColor: '#FFFFFF' }}>
        <div style={{position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}></div>

        {/* File */}
        <FileIconMenu/>

        {/* Edit */}
        <EditIconMenu/>

        {/* Window */}
        <WindowIconMenu rootElement={this.props.rootElement} />

        {/* Help */}
        <HelpIconMenu/>

      </MenuBarContent>
    </div>;
  },
});

export default MenuBar;
