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

import { ModelEditorState } from '../../types';

import CanvasShared from '../../canvas/shared';

import {
  DispatchAction,
} from '../../types';

import PreviewView from '../../canvas/views/preview';

import { voxelRotate } from '../../voxels/actions';

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
  focus: boolean;
  sizeVersion: number;
  canvasShared: CanvasShared;
  dispatchAction: DispatchAction;
  onChange: (fileId: string, voxelEditorState: ModelEditorState) => any;
  intl?: InjectedIntlProps;
}

@connectSource({
  panelTypes: PanelTypes,
  panelId: Panels.preview,
  title: messages.title,
})
@injectIntl
class PreviewPanel extends React.Component<PreviewPanelProps, {}> {
  view: PreviewView;

  handleClickRotate(axis) {
    this.props.dispatchAction(voxelRotate(axis));
  };

  componentDidMount() {
    this.view = new PreviewView({
      container: findDOMNode<HTMLElement>(this.refs['canvas']),
      canvasShared: this.props.canvasShared,
    });
  }

  componentWillReceiveProps(nextProps: PreviewPanelProps) {
    if (this.props.sizeVersion !== nextProps.sizeVersion) {
      this.view.resize();
    }
  }

  componentWillUnmount() {
    this.view.destroy();
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
