import * as React from 'react';
const pure = require('recompose/pure').default;

import { findDOMNode } from 'react-dom';
import { EventEmitter, EventSubscription } from 'fbemitter';
import FlatButton from 'material-ui/lib/flat-button';
import FontIcon from 'material-ui/lib/font-icon';
import * as Colors from 'material-ui/lib/styles/colors';
import * as ReactDnd from 'react-dnd';
const objectAssign = require('object-assign');
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

import { connectSource } from '../../../Panel';

import {
  PanelTypes,
  Panels,
} from '../../panel';

import {
  ModelEditorState,
  CameraStore,
} from '../../types';

import Stores from '../../canvas/stores';

import {
  DispatchAction,
} from '../../types';

import PreviewCanvas from '../../canvas/PreviewCanvas';

import { voxelRotate } from '../../actions';

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
  sizeVersion: number;
  stores: Stores;
  cameraStore: CameraStore;
  dispatchAction: DispatchAction;
  intl?: InjectedIntlProps;
}

@connectSource({
  panelTypes: PanelTypes,
  panelId: Panels.preview,
  title: messages.title,
})
@injectIntl
class PreviewPanel extends React.Component<PreviewPanelProps, {}> {
  canvas: PreviewCanvas;

  handleClickRotate(axis) {
    this.props.dispatchAction(voxelRotate(axis));
  };

  componentDidMount() {
    this.canvas = new PreviewCanvas({
      container: findDOMNode<HTMLElement>(this.refs['canvas']),
      stores: this.props.stores,
      cameraStore: this.props.cameraStore,
    });
    this.canvas.init();
  }

  componentWillReceiveProps(nextProps: PreviewPanelProps) {
    if (this.props.sizeVersion !== nextProps.sizeVersion) {
      this.canvas.resize();
    }
  }

  componentDidUpdate(prevProps: PreviewPanelProps) {
    if (this.props.cameraStore !== prevProps.cameraStore) {
      this.canvas.onCameraStoreChange(this.props.cameraStore);
    }
  }

  componentWillUnmount() {
    this.canvas.destroy();
  }

  render() {
    const { } = this.props;

    return (
      <div>
        <div
          style={{
            width: 150,
            height: 150,
            border: '1px solid #BFBFBF',
            borderRadius: 2,
          }}
          ref={'canvas'}
        >
        </div>
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
