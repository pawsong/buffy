import * as React from 'react';
import { findDOMNode } from 'react-dom';
const pure = require('recompose/pure').default;

import * as THREE from 'three';

import * as pako from 'pako';

import * as Immutable from 'immutable';

import { DropTarget } from 'react-dnd';
const HTML5Backend = require('react-dnd-html5-backend');
const update = require('react-addons-update');
import { EventEmitter, EventSubscription } from 'fbemitter';
const objectAssign = require('object-assign');
import * as invariant from 'invariant';
import RaisedButton from 'material-ui/lib/raised-button';
import { reset, undo, redo } from '@pasta/helper/lib/undoable';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import * as ndarray from 'ndarray';

import { Keyboard } from '../../keyboard';

import { SimpleStore } from '../../libs';

import Messages from '../../constants/Messages';

import * as StorageKeys from '../../constants/StorageKeys';

import { connectTarget } from '../Panel';

import {
  rgbToHex,
} from './canvas/utils';

import {
  PIXEL_SCALE,
} from '../../canvas/Constants';

import {
  FileState,
  VoxelData,
  Action,
  ToolType,
  Color,
  ModelEditorState,
  ActionListener,
  ExtraData,
  Position,
  CommonState,
  SerializedData,
} from './types';

import {
  changeTool,
  changePaletteColor,
  voxelRemoveSelected,
  voxelMergeFragment,
  voxelClearSelection,
} from './actions';

import HistoryPanel from './components/panels/HistoryPanel';
import ToolsPanel from './components/panels/ToolsPanel';

import FullscreenButton from './components/FullscreenButton';
import ApplyButton from './components/ApplyButton';

import ModelEditorCanvas from './canvas/ModelEditorCanvas';

import commonReducer from './reducers/common';
import fileReducer from './reducers/file';

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
  commonState: CommonState;
  onCommonStateChange: (commonState: CommonState) => any;
  fileState: FileState;
  onFileStateChange: (fileState: FileState) => any;
  onApply: () => any;
  sizeVersion: number;
  extraData: ExtraData;
  intl?: InjectedIntlProps;
}

interface ContainerStates {
  fullscreen?: boolean;
}

@pure
@injectIntl
@connectTarget({
  panelTypes: PanelTypes,
  panelIds: Object.keys(Panels).map(key => Panels[key]),
  mapIdToLocalStorageKey: panelId => `${StorageKeys.VOXEL_EDITOR_PANEL_PREFIX}.${panelId}`,
})
class ModelEditor extends React.Component<ModelEditorProps, ContainerStates> {
  static createCommonState: () => CommonState;
  static createFileState: (data?: VoxelData) => FileState;
  static createExtraData: (size: Position) => ExtraData;
  static isModified: (lhs: ModelEditorState, rhs: ModelEditorState) => boolean;
  static serialize: (fileState: FileState) => SerializedData;
  static deserialize: (data: SerializedData) => FileState;

  canvas: ModelEditorCanvas;

  private keyboard: Keyboard;

  constructor(props) {
    super(props);

    this.keyboard = new Keyboard();

    this.state = {
      fullscreen: false,
    };
  }

  dispatchAction = (action: Action<any>, callback?: () => any) => {
    const nextCommonState = commonReducer(this.props.commonState, action);
    if (this.props.commonState !== nextCommonState) this.props.onCommonStateChange(nextCommonState);

    const nextFileState = fileReducer(this.props.fileState, action);
    if (this.props.fileState !== nextFileState) this.props.onFileStateChange(nextFileState);
  }

  handleFullscreenButtonClick() {
    this.setState({ fullscreen: !this.state.fullscreen }, () => this.canvas.resize());
  }

  getEditorState(): ModelEditorState {
    return {
      common: this.props.commonState,
      file: this.props.fileState,
    };
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    switch(e.keyCode) {
      case 8: // Backspace
      case 46: // delete
      {
        if (this.props.fileState.present.data.selection) {
          this.dispatchAction(voxelRemoveSelected());
        }
        break;
      }
      case 27: // ESC
      {
        if (this.props.fileState.present.data.fragment) {
          this.dispatchAction(voxelMergeFragment());
        } else if (this.props.fileState.present.data.selection) {
          this.dispatchAction(voxelClearSelection());
        }
        break;
      }
    }

    if (e.ctrlKey || e.metaKey) {
      if (e.shiftKey) {
        // CTRL or COMMAND + SHIFT

        switch(e.keyCode) {
          case 90: // Z
          {
            if (this.props.fileState.future.length > 0) {
              this.dispatchAction(redo());
            }
            break;
          }
        }
      } else {
        // CTRL or COMMAND

        switch(e.keyCode) {
          case 90: // Z
          {
            if (this.props.fileState.past.length > 0) {
              this.dispatchAction(undo());
            }
            break;
          }
        }
      }
    }
  };

  componentDidMount() {
    this.canvas = new ModelEditorCanvas({
      container: findDOMNode<HTMLElement>(this.refs['canvas']),
      camera: this.props.extraData.camera,
      dispatchAction: this.dispatchAction,
      state: this.getEditorState(),
      keyboard: this.keyboard,
    });
    this.canvas.init();

    document.addEventListener('keydown', this.handleKeyDown, false);
  }

  componentDidUpdate(prevProps: ModelEditorProps) {
    if (prevProps.sizeVersion !== this.props.sizeVersion) {
      this.canvas.resize();
    }

    if (this.props.fileState !== prevProps.fileState) {
      this.canvas.onStateChange(this.getEditorState());
    } else if (this.props.commonState !== prevProps.commonState) {
      this.canvas.onStateChange(this.getEditorState());
    }

    if (prevProps.extraData !== this.props.extraData) {
      this.canvas.onChangeCamera(this.props.extraData.camera);
    }
  }

  componentWillUnmount() {
    this.canvas.destroy();
    document.removeEventListener('keydown', this.handleKeyDown, false);
    this.keyboard.dispose();
  }

  selectTool = (selectedTool: ToolType) => this.dispatchAction(changeTool(selectedTool));
  changePaletteColor = (paletteColor: Color) => this.dispatchAction(changePaletteColor(paletteColor));

  renderPanels() {
    return (
      <div>
        <HistoryPanel
          voxel={this.props.fileState}
          dispatchAction={this.dispatchAction}
        />
        <ToolsPanel
          paletteColor={this.props.commonState.paletteColor}
          selectedTool={this.props.commonState.selectedTool}
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

ModelEditor.createCommonState = () => {
  return commonReducer(undefined, { type: '' });
};

ModelEditor.createFileState = (data): FileState => {
  return data ? fileReducer(undefined, reset(data)) : fileReducer(undefined, { type: '' });
}

var radius = PIXEL_SCALE * 25, theta = 90, phi = 45;

ModelEditor.createExtraData = (size: Position) => {
  const camera = new THREE.PerspectiveCamera();
  camera.fov = 40;
  camera.near = 1;
  camera.far = 10000;
  camera.position.set(
    radius * Math.cos(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360)
      + size[0] * PIXEL_SCALE / 2,
    radius * Math.sin(phi * Math.PI / 360)
      + size[1] * PIXEL_SCALE / 4,
    radius * Math.sin(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360)
      + size[2] * PIXEL_SCALE / 2
  );

  return {
    camera,
  };
};

ModelEditor.isModified = function (lhs: FileState, rhs: FileState) {
  return lhs.present !== rhs.present;
};

ModelEditor.serialize = (fileState) => {
  const data: any = pako.deflate(fileState.present.data.matrix.data.buffer);

  return {
    data,
    shape: fileState.present.data.matrix.shape,
  };
}

ModelEditor.deserialize = data => {
  const inflated = pako.inflate(data.data);
  const matrix = ndarray(new Int32Array(inflated.buffer), data.shape);

  return ModelEditor.createFileState({
    size: data.shape,
    matrix,
    selection: null,
    fragment: null,
    fragmentOffset: [0, 0, 0],
  });
}

export default ModelEditor;
