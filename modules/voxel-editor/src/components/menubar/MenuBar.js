import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as ColorActions from '../../actions/color';
import * as SpriteActions from '../../actions/sprite';
import * as WorkspaceActions from '../../actions/workspace';

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

        {/* Edit */}
        <EditIconMenu actions={this.props.actions} />

      </MenuBarContent>
    </div>;
  },
});

export default connect(state => ({
  voxel: state.voxel,
  color: state.color,
  sprite: state.sprite,
  workspace: state.workspace,
}), dispatch => ({
  actions: bindActionCreators({
    ...SpriteActions,
    ...ColorActions,
    ...WorkspaceActions,
  }, dispatch),
}))(MenuBar);
