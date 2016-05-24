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

import * as ndarray from 'ndarray';

import Messages from '../../constants/Messages';

import * as StorageKeys from '../../constants/StorageKeys';

import { connectTarget } from '../Panel';

import mesher from './canvas/meshers/greedy';

import Stores from './canvas/stores';

import {
  rgbToHex,
} from './canvas/utils';

import {
  VoxelState,
  Action,
  ToolType,
  Color,
  ModelEditorState,
  ActionListener,
} from './types';

import {
  changeTool,
  changePaletteColor,
} from './actions';

import HistoryPanel from './components/panels/HistoryPanel';
import PreviewPanel from './components/panels/PreviewPanel';
import ToolsPanel from './components/panels/ToolsPanel';

import FullscreenButton from './components/FullscreenButton';
import ApplyButton from './components/ApplyButton';

import ModelEditorCanvas from './canvas/ModelEditorCanvas';

import rootReducer from './reducers';

const styles = {
  canvas: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
  },
};

import {
  PanelTypes,
  Panels,
} from './panel';

export { ModelEditorState };

interface ModelEditorProps extends React.Props<ModelEditor> {
  editorState: ModelEditorState;
  onChange: (voxelEditorState: ModelEditorState) => any;
  onApply: () => any;
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
class ModelEditor extends React.Component<ModelEditorProps, ContainerStates> {
  static createState: (fileId: string, options?: CreateStateOptions) => ModelEditorState;
  static isModified: (lhs: ModelEditorState, rhs: ModelEditorState) => boolean;

  stores: Stores;
  canvas: ModelEditorCanvas;

  constructor(props) {
    super(props);

    this.state = {
      fullscreen: false,
    };
  }

  handleStateChange(editorState: ModelEditorState) {
    this.props.onChange(editorState);
  }

  dispatchAction = (action: Action<any>, callback?: () => any) => {
    const nextState = rootReducer(this.props.editorState, action);

    // TODO: Support callback
    this.props.onChange(nextState);
  }

  handleFullscreenButtonClick() {
    this.setState({ fullscreen: !this.state.fullscreen }, () => this.canvas.resize());
  }

  componentWillMount() {
    this.stores = new Stores(this.props.editorState.voxel);
  }

  componentDidMount() {
    this.canvas = new ModelEditorCanvas({
      container: findDOMNode<HTMLElement>(this.refs['canvas']),
      stores: this.stores,
      dispatchAction: this.dispatchAction,
      getEditorState: () => this.props.editorState,
    });
    this.canvas.init();
  }

  componentWillReceiveProps(nextProps: ModelEditorProps) {
    if (nextProps.sizeVersion !== this.props.sizeVersion) {
      this.canvas.resize();
    }

    if (this.props.editorState.voxel !== nextProps.editorState.voxel) {
      this.stores.voxelStateChange(nextProps.editorState.voxel);
    }

    if (this.props.editorState !== nextProps.editorState) {
      this.canvas.updateState(nextProps.editorState);
    }
  }

  componentWillUnmount() {
    this.canvas.destroy();
    this.stores.destroy();
  }

  selectTool = (selectedTool: ToolType) => this.dispatchAction(changeTool(selectedTool));
  changePaletteColor = (paletteColor: Color) => this.dispatchAction(changePaletteColor(paletteColor));

  renderPanels() {
    return (
      <div>
        <HistoryPanel
          voxel={this.props.editorState.voxel}
          dispatchAction={this.dispatchAction}
        />
        <PreviewPanel
          focus={this.props.focus}
          stores={this.stores}
          dispatchAction={this.dispatchAction}
          sizeVersion={this.props.sizeVersion}
        />
        <ToolsPanel
          paletteColor={this.props.editorState.common.paletteColor}
          selectedTool={this.props.editorState.common.selectedTool}
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
        <ApplyButton
          onTouchTap={this.props.onApply}
        />
        {this.renderPanels()}
      </div>
    );
  }
}

ModelEditor.createState = function VoxelEditor(options: CreateStateOptions = {}): ModelEditorState {
  // let voxel: VoxelState = initialVoxelState;

  // if (options.voxels) {
  //   const data = Immutable.Map().withMutations(mutable => {
  //     options.voxels.forEach(voxel => {
  //       mutable.set(Immutable.Iterable(voxel.position), voxel);
  //     });
  //   });

  //   voxel = update(initialVoxelState, {
  //     present: { data: { $set: data } },
  //   });
  // }

  const initialState = rootReducer({}, { type: '' });
  return Object.assign(initialState);
}

ModelEditor.isModified = function (lhs: ModelEditorState, rhs: ModelEditorState) {
  return lhs.voxel.present !== rhs.voxel.present;
};

export default ModelEditor;
