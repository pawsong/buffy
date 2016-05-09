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

import Panel from '../../../Panel';

import { VoxelEditorState } from '../../interface';

import CanvasShared from '../../canvas/shared';

import {
  DispatchAction,
} from '../../interface';

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
  fileId: string;
  focus: boolean;
  sizeVersion: number;
  canvasShared: CanvasShared;
  dispatchAction: DispatchAction;
  onChange: (fileId: string, voxelEditorState: VoxelEditorState) => any;
  intl?: InjectedIntlProps;
}

@injectIntl
class PreviewPanel extends React.Component<PreviewPanelProps, {}> {
  static PANEL_ID: string;

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

    const fileChanged = this.props.fileId !== nextProps.fileId;
    const unfocused = this.props.focus === true && nextProps.focus === false;

    if (fileChanged || unfocused) this.updateDataUrl();
  }

  updateDataUrl() {
    const canvasElement = this.view.renderer.domElement;
    const url = canvasElement.toDataURL();
    this.props.onChange(this.props.fileId, { image: { url }});
  }

  componentWillUnmount() {
    this.updateDataUrl();
    this.view.destroy();
  }

  render() {
    const { } = this.props;

    return (
      <Panel
        panelId={PreviewPanel.PANEL_ID}
        title={this.props.intl.formatMessage(messages.title)}
      >
        <div
          style={{ width: 150, height: 150 }}
          ref={'canvas'}
        >
        </div>
        <div>
          <RotateButton onClick={() => this.handleClickRotate('x')}>X</RotateButton>
          <RotateButton onClick={() => this.handleClickRotate('y')}>Y</RotateButton>
          <RotateButton onClick={() => this.handleClickRotate('z')}>Z</RotateButton>
        </div>
      </Panel>
    );
  };
};

PreviewPanel.PANEL_ID = 'preview';

export default PreviewPanel;
