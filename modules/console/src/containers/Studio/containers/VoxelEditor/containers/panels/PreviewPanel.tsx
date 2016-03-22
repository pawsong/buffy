import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { EventEmitter, EventSubscription } from 'fbemitter';
import FlatButton from 'material-ui/lib/flat-button';
import FontIcon from 'material-ui/lib/font-icon';
import * as Colors from 'material-ui/lib/styles/colors';
import * as ReactDnd from 'react-dnd';
const objectAssign = require('object-assign');
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

import { CanvasShared } from '../../canvas/shared';

import { wrapPanel } from './Panel';

import initPreview from '../../canvas/views/preview';

import { State } from '../../../../../../reducers';
import {
  voxelRotate,
} from '../../../../../../actions/voxelEditor';

const messages = defineMessages({
  title: {
    id: 'voxel-editor.panels.preview.title',
    description: 'Voxel editor preview panel title',
    defaultMessage: 'Preview',
  },
});

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
      }} secondary={true} onTouchTap={this.props.onClick}>
        <FontIcon className="material-icons">rotate_90_degrees_ccw</FontIcon>
        <div>{this.props.children}</div>
      </FlatButton>
    </div>;
  };
};

interface PreviewPanelProps extends React.Props<PreviewPanel> {
  canvasShared: CanvasShared;
  sizeVersion: number;
  voxelRotate?: (axis: string) => any;
}

@wrapPanel({
  title: messages.title,
})
@connect((state: State) => ({
}), {
  voxelRotate,
})
class PreviewPanel extends React.Component<PreviewPanelProps, {}> {
  canvas: any;

  handleClickRotate(axis) {
    this.props.voxelRotate(axis);
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
    const { } = this.props;

    return (
      <div>
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
