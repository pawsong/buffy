import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { EventEmitter, EventSubscription } from 'fbemitter';
import FlatButton = require('material-ui/lib/flat-button');
import FontIcon = require('material-ui/lib/font-icon');
import * as Colors from 'material-ui/lib/styles/colors';
import * as ReactDnd from 'react-dnd';
import objectAssign = require('object-assign');

import { CanvasShared } from '../../canvas/shared';

import {
  PanelConstants,
  PanelStyles,
  wrapPanel
} from './Panel';

import initPreview from '../../canvas/views/preview';

import { State } from '../../../../../../reducers';
import {
  voxelRotate,
} from '../../../../../../actions/voxelEditor';

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
  canvasShared: CanvasShared;
  sizeVersion: number;

  actions: any;
  left: number;
  top: number;
  zIndex: number;
  connectDragPreview: ReactDnd.ConnectDragPreview;
  connectDragSource: ReactDnd.ConnectDragSource;
  isDragging: boolean;
  voxelRotate: (axis: string) => any;
}

@wrapPanel
@connect((state: State) => ({
}), {
  voxelRotate,
})
class PreviewPanel extends React.Component<PreviewPanelProps, {}> {
  canvas: any;

  handleClickRotate(axis) {
    this.props.actions.voxelRotate(axis);
  };

  componentDidMount() {
    this.canvas = initPreview(this.refs['canvas'], this.props.canvasShared);
  }

  componentWillReceiveProps(nextProps: PreviewPanelProps) {
    if (this.props.sizeVersion !== nextProps.sizeVersion) {
      this.canvas.resize();
    }
  }

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

    return connectDragPreview(
      <div style={objectAssign({ zIndex, left, top, opacity }, PanelStyles.root)}>
        {connectDragSource(<div style={PanelStyles.handle}>Preview</div>)}
        <div style={{ width: 150, height: 150 }} ref="canvas"></div>
        <div>
          <RotateButton onClick={() => this.handleClickRotate('x')}>X</RotateButton>
          <RotateButton onClick={() => this.handleClickRotate('y')}>Y</RotateButton>
          <RotateButton onClick={() => this.handleClickRotate('z')}>Z</RotateButton>
        </div>
      </div>
    );
  };
};

export default PreviewPanel;
