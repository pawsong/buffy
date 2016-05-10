import * as React from 'react';
import { findDOMNode } from 'react-dom';
const pure = require('recompose/pure').default;

import * as Immutable from 'immutable';

import { DropTarget } from 'react-dnd';
const HTML5Backend = require('react-dnd-html5-backend');
const update = require('react-addons-update');
import { EventEmitter, EventSubscription } from 'fbemitter';
const objectAssign = require('object-assign');
import * as invariant from 'invariant';
import RaisedButton from 'material-ui/lib/raised-button';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import Messages from '../../constants/Messages';

import * as StorageKeys from '../../constants/StorageKeys';

import { connectTarget } from '../Panel';

import mesher from './canvas/meshers/greedy';

import {
  rgbToHex,
  voxelMapToArray,
} from './canvas/utils';

import {
  VoxelState,
} from './interface';

import HistoryPanel from './components/panels/HistoryPanel';
import PreviewPanel from './components/panels/PreviewPanel';
import ToolsPanel from './components/panels/ToolsPanel';

import FullscreenButton from './components/FullscreenButton';

import CanvasShared from './canvas/shared';
import MainCanvas from './canvas/views/main';

import voxelReducer, {
  initialState as initialVoxelState,
} from './voxels/reducer';

const styles = {
  canvas: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
  },
};

import {
  Action,
  ToolType,
  Color,
  VoxelEditorState,
} from './interface';

import {
  PanelTypes,
  Panels,
} from './panel';

export { VoxelEditorState };

interface VoxelEditorProps extends React.Props<VoxelEditor> {
  editorState: VoxelEditorState;
  onChange: (fileId: string, voxelEditorState: VoxelEditorState) => any;
  sizeVersion: number;
  focus: boolean;
  intl?: InjectedIntlProps;
}

interface ContainerStates {
  fullscreen?: boolean;
}

export interface CreateStateOptions {
  voxels?: any;
}

@pure
@injectIntl
@connectTarget({
  panelTypes: PanelTypes,
  panelIds: Object.keys(Panels).map(key => Panels[key]),
  mapIdToLocalStorageKey: panelId => `${StorageKeys.VOXEL_EDITOR_PANEL_PREFIX}.${panelId}`,
})
class VoxelEditor extends React.Component<VoxelEditorProps, ContainerStates> {
  static createState: (fileId: string, options?: CreateStateOptions) => VoxelEditorState;

  canvasShared: CanvasShared;
  canvas: MainCanvas;

  constructor(props) {
    super(props);

    this.state = {
      fullscreen: false,
    };
  }

  handleStateChange(editorState: VoxelEditorState) {
    this.props.onChange(this.props.editorState.fileId, editorState);
  }

  dispatchVoxelAction = (action: Action<any>) => {
    const voxel = voxelReducer(this.props.editorState.voxel, action);
    this.handleStateChange({ voxel });
  }

  handleFullscreenButtonClick() {
    this.setState({ fullscreen: !this.state.fullscreen }, () => this.canvas.resize());
  }

  componentWillMount() {
    this.canvasShared = new CanvasShared({
      getState: () => this.props.editorState.voxel,
    });
  }

  componentDidMount() {
    this.canvas = new MainCanvas({
      container: findDOMNode<HTMLElement>(this.refs['canvas']),
      canvasShared: this.canvasShared,
      dispatchAction: action => this.dispatchVoxelAction(action),
      handleEditorStateChange: (nextState: VoxelEditorState) => this.handleStateChange(nextState),
      getEditorState: () => this.props.editorState,
    });
  }

  componentWillReceiveProps(nextProps: VoxelEditorProps) {
    if (nextProps.sizeVersion !== this.props.sizeVersion) {
      this.canvas.resize();
    }

    if (this.props.editorState.voxel !== nextProps.editorState.voxel) {
      this.canvasShared.voxelStateChange(nextProps.editorState.voxel);
    }

    if (this.props.editorState !== nextProps.editorState) {
      this.canvas.updateState(nextProps.editorState);
    }
  }

  componentWillUnmount() {
    this.canvas.destroy();
  }

  changePaletteColor = (paletteColor: Color) => this.handleStateChange({ paletteColor });

  selectTool = (selectedTool: ToolType) => this.handleStateChange({ selectedTool });

  renderPanels() {
    return (
      <div>
        <HistoryPanel
          voxel={this.props.editorState.voxel}
          dispatchAction={this.dispatchVoxelAction}
        />
        <PreviewPanel
          fileId={this.props.editorState.fileId}
          focus={this.props.focus}
          onChange={this.props.onChange}
          canvasShared={this.canvasShared}
          dispatchAction={this.dispatchVoxelAction}
          sizeVersion={this.props.sizeVersion}
        />
        <ToolsPanel
          paletteColor={this.props.editorState.paletteColor}
          selectedTool={this.props.editorState.selectedTool}
          changePaletteColor={this.changePaletteColor}
          selectTool={this.selectTool}
        />
      </div>
    );
  }

  render() {
    const style = this.state.fullscreen ? {
      position: 'fixed',
      top: 0, left: 0, bottom: 0, right: 0,
      zIndex: 1,
    } : {
      width: '100%',
      height: '100%',
    };

    return (
      <div style={style}>
        <div style={styles.canvas} ref="canvas"></div>
        <FullscreenButton
          onTouchTap={() => this.handleFullscreenButtonClick()}
          fullscreen={this.state.fullscreen}
        />
        {this.renderPanels()}
      </div>
    );
  }
}

VoxelEditor.createState = function VoxelEditor(fileId: string, options: CreateStateOptions = {}): VoxelEditorState {
  let voxel: VoxelState = initialVoxelState;

  if (options.voxels) {
    const data = Immutable.Map().withMutations(mutable => {
      options.voxels.forEach(voxel => {
        mutable.set(Immutable.Iterable(voxel.position), voxel);
      });
    });

    voxel = update(initialVoxelState, {
      present: { data: { $set: data } },
    });
  }

  return {
    fileId,
    selectedTool: ToolType.brush,
    paletteColor: { r: 104, g: 204, b: 202 },
    voxel,
    image: { url: '' },
  };
}

export default VoxelEditor;
