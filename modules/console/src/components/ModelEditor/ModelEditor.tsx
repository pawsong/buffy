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
import RaisedButton from 'material-ui/RaisedButton';
import { reset, undo, redo } from '@pasta/helper/lib/undoable';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import * as ndarray from 'ndarray';

import { Keyboard } from '../../keyboard';

import { SimpleStore } from '../../libs';

import Messages from '../../constants/Messages';

import * as StorageKeys from '../../constants/StorageKeys';

import { connectTarget } from '../Panel';

import {
  importVoxFile,
  exportVoxFile,
} from './io';

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
  voxelCopy,
  voxelPaste,
} from './actions';

import HistoryPanel from './components/panels/HistoryPanel';
import ToolsPanel from './components/panels/ToolsPanel';

import FullscreenButton from './components/FullscreenButton';
import ApplyButton from './components/ApplyButton';

import ModelEditorCanvas from './canvas/ModelEditorCanvas';

import commonReducer from './reducers/common';
import fileReducer from './reducers/file';

const styles = {
  root: {
    top: 0, left: 0, bottom: 0, right: 0,
    overflow: 'hidden',
  },
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
  focus: boolean;
  intl?: InjectedIntlProps;
}

interface ContainerStates {
  fullscreen?: boolean;
}

interface ImportFileResult {
  result?: FileState;
  error?: string;
}

interface ExportFileResult {
  result?: Uint8Array;
  error?: string;
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
  static importVoxFile: (buffer: ArrayBuffer) => ImportFileResult;
  static exportVoxFile: (fileState: FileState) => ExportFileResult;

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
    e.preventDefault();

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
          case 67: // C
          {
            const { clipboard } = this.props.commonState;
            const { model, selection } = this.props.fileState.present.data;

            if (selection) {
              if (!clipboard || clipboard.model !== model || clipboard.selection !== selection) {
                this.dispatchAction(voxelCopy(model, selection));
              }
            }
            break;
          }
          case 86: // V
          {
            const { clipboard } = this.props.commonState;
            if (clipboard) {
              this.dispatchAction(voxelPaste(clipboard.model, clipboard.selection));
            }
            break;
          }
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

    if (this.props.focus) this.bindKeyListener();
  }

  bindKeyListener() {
    document.addEventListener('keydown', this.handleKeyDown, false);
  }

  unbindKeyListener() {
    document.removeEventListener('keydown', this.handleKeyDown, false);
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

    if (prevProps.focus !== this.props.focus) {
      if (this.props.focus) {
        this.bindKeyListener();
      } else {
        this.unbindKeyListener();
      }
    }
  }

  componentWillUnmount() {
    this.canvas.destroy();
    this.unbindKeyListener();
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
    const rootStyle = this.state.fullscreen ? Object.assign({}, styles.root, {
      position: 'fixed',
      zIndex: 10000,
    }) : Object.assign({}, styles.root, {
      position: 'absolute',
    });

    return (
      <div style={rootStyle}>
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

var radius = PIXEL_SCALE * 50, theta = 135, phi = 45;

ModelEditor.createExtraData = (size: Position) => {
  const camera = new THREE.PerspectiveCamera();
  camera.fov = 40;
  camera.near = 1;
  camera.far = 30000;
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
  const data: any = pako.deflate(fileState.present.data.model.data.buffer);

  return {
    data,
    shape: fileState.present.data.model.shape,
  };
}

ModelEditor.deserialize = data => {
  const inflated = pako.inflate(data.data);
  const model = ndarray(new Int32Array(inflated.buffer), data.shape);

  return ModelEditor.createFileState({
    size: data.shape,
    model,
    selection: null,
    fragment: null,
    fragmentOffset: [0, 0, 0],
  });
}

ModelEditor.importVoxFile = buffer => {
  const { result, error } = importVoxFile(buffer);

  if (error) {
    return { error };
  } else {
    return {
      result: ModelEditor.createFileState({
        size: result.shape,
        model: result,
        selection: null,
        fragment: null,
        fragmentOffset: [0, 0, 0],
      }),
    };
  }
}

ModelEditor.exportVoxFile = fileState => {
  return exportVoxFile(fileState.present.data.model);
};

export default ModelEditor;
