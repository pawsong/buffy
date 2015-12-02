import React from 'react';
import {
  FlatButton,
  RaisedButton,
  IconButton,
  FontIcon,
} from 'material-ui';

import Colors from 'material-ui/lib/styles/colors';

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
import * as VoxelActions from '../actions/voxel';

import config from '@pasta/config-public';

import { initPreview } from '../canvas';

const RotateButton = React.createClass({
  render() {
    return <div style={{
      display: 'inline-block',
      width: '33%',
      textAlign: 'center',
    }}>
      <FlatButton style={{
        display: 'inline-block',
        minWidth: 0,
        lineHeight: 1.2,
        margin: 4,
        padding: 6,
      }} secondary={true} onClick={this.props.onClick}>
        <FontIcon className="material-icons">rotate_90_degrees_ccw</FontIcon>
        <div>{this.props.children}</div>
      </FlatButton>
    </div>;
  },
});

const PreviewPanel = React.createClass({
  _canvasRef(element) {
    initPreview(element);
  },

  _handleClickRotate(axis) {
    this.props.actions.voxelRotate(axis);
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
        <div>
          <RotateButton onClick={this._handleClickRotate.bind(this, 'x')}>X</RotateButton>
          <RotateButton onClick={this._handleClickRotate.bind(this, 'y')}>Y</RotateButton>
          <RotateButton onClick={this._handleClickRotate.bind(this, 'z')}>Z</RotateButton>
        </div>
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
    ...VoxelActions,
  }, dispatch),
}))(wrapPanel(PreviewPanel));
