import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { EventEmitter, EventSubscription } from 'fbemitter';
import FlatButton = require('material-ui/lib/flat-button');
import FontIcon = require('material-ui/lib/font-icon');
import * as Colors from 'material-ui/lib/styles/colors';
import * as ReactDnd from 'react-dnd';
import objectAssign = require('object-assign');

import {
  PanelConstants,
  PanelStyles,
  wrapPanel
} from './Panel';

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
  addonEmitter: EventEmitter;
}

class PreviewPanel extends React.Component<PreviewPanelProps, {}> {
  canvas: any;
  resizeToken: EventSubscription;

  _handleClickRotate(axis) {
    this.props.actions.voxelRotate(axis);
  };

  componentDidMount() {
    this.canvas = initPreview(this.refs['canvas']);
    this.resizeToken = this.props.addonEmitter.addListener('resize', () => this.canvas.resize());
  }

  componentWillUnmount() {
    this.resizeToken.remove();
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
        <div style={{ width: 150, height: 150 }} ref="canvas"></div>
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
