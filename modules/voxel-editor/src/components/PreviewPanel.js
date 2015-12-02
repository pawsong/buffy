import React from 'react';
import {
  RaisedButton,
} from 'material-ui';

import NotImplDialog from './menubar/NotImplDialog';
import FileBrowserDialog from './menubar/FileBrowserDialog';
import SaveDialog from './menubar/SaveDialog';

import {
  PanelConstants,
  PanelStyles,
  wrapPanel
} from './Panel';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as WorkspaceActions from '../actions/workspace';

import config from '@pasta/config-public';

import { initPreview } from '../canvas';

const PreviewPanel = React.createClass({
  _canvasRef(element) {
    initPreview(element);
  },

  render() {
    const {
      left,
      top,
      zIndex,
      connectDragPreview,
      connectDragSource,
      isDragging,
    } = this.props;

    const opacity = isDragging ? PanelConstants.DRAGGING_OPACITY : 1;

    return <div>
      {connectDragPreview(<div style={{
        ...PanelStyles.root, zIndex, left, top, opacity,
      }}>
        {connectDragSource(<div style={PanelStyles.handle}>Preview</div>)}
        <div style={{ width: 150, height: 150 }} ref={this._canvasRef}></div>
      </div>)}
    </div>;
  },
});

export default connect(state => ({
  voxel: state.voxel,
  workspace: state.workspace,
}), dispatch => ({
  actions: bindActionCreators({
    ...WorkspaceActions,
  }, dispatch),
}))(wrapPanel(PreviewPanel));
