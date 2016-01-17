import * as React from 'react';
import {
  FlatButton,
  RaisedButton,
  IconButton,
  FontIcon,
} from 'material-ui';

import objectAssign = require('object-assign');

import * as Colors from 'material-ui/lib/styles/colors';

import * as ReactDnd from 'react-dnd';

import {
  PanelConstants,
  PanelStyles,
  wrapPanel
} from './Panel';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as WorkspaceActions from '../actions/workspace';
import * as VoxelActions from '../actions/voxel';

import { initPreview } from '../canvas';

interface RotateButtonProps extends React.Props<RotateButton> {
  onClick: () => void;
}

class RotateButton extends React.Component<RotateButtonProps, {}> {
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
  };
};

interface PreviewPanelProps extends React.Props<PreviewPanel> {
  actions: any;
  left: number;
  top: number;
  zIndex: number;
  connectDragPreview: ReactDnd.ConnectDragPreview;
  connectDragSource: ReactDnd.ConnectDragSource;
  isDragging: boolean;
}

class PreviewPanel extends React.Component<PreviewPanelProps, {}> {
  canvas: any;

  _canvasRef(element) {
    if (!element) { return; }
    if (this.canvas) { return; }
    this.canvas = initPreview(element);
  };

  _handleClickRotate(axis) {
    this.props.actions.voxelRotate(axis);
  };

  componentWillUnmount() {
    this.canvas.destroy();
  }

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
      {connectDragPreview(<div style={objectAssign({ zIndex, left, top, opacity }, PanelStyles.root)}>
        {connectDragSource(<div style={PanelStyles.handle}>Preview</div>)}
        <div style={{ width: 150, height: 150 }} ref={this._canvasRef.bind(this)}></div>
        <div>
          <RotateButton onClick={this._handleClickRotate.bind(this, 'x')}>X</RotateButton>
          <RotateButton onClick={this._handleClickRotate.bind(this, 'y')}>Y</RotateButton>
          <RotateButton onClick={this._handleClickRotate.bind(this, 'z')}>Z</RotateButton>
        </div>
      </div>)}
    </div>;
  };
};

export default connect(state => ({
  voxel: state.voxel,
  workspace: state.workspace,
}), dispatch => ({
  actions: bindActionCreators(objectAssign({},
    WorkspaceActions,
    VoxelActions
  ), dispatch),
}))(wrapPanel(PreviewPanel));
