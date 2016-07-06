import * as React from 'react';
import { findDOMNode } from 'react-dom';
const pure = require('recompose/pure').default;

import THREE from 'three';

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

const msgpack = require('msgpack-lite');

let screenfull;
if (__CLIENT__) {
  screenfull = require('screenfull');
}

import { Keyboard } from '../../keyboard';

import { SimpleStore } from '../../libs';

import Messages from '../../constants/Messages';

import * as StorageKeys from '../../constants/StorageKeys';

import { connectTarget } from '../Panel';

import createFileState from './utils/createFileState';
import deserialize from './utils/deserialize';

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

import GeometryFactory from '../../canvas/GeometryFactory';

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
  Axis,
} from './types';

import {
  changeTool3d,
  changeTool2d,
  changePaletteColor,
  voxelRemoveSelected2d,
  voxelRemoveSelected,
  voxelMergeFragment,
  voxelClearSelection,
  voxelCopy,
  voxelPaste,
  enterMode2D,
  leaveMode2D,
} from './actions';

import HistoryPanel from './components/panels/HistoryPanel';
import ToolsPanel from './components/panels/ToolsPanel';

import FullscreenButton from './components/FullscreenButton';
import ApplyButton from './components/ApplyButton';
import Tips from './components/Tips';

import ModelEditorCanvas from './canvas/ModelEditorCanvas';

import commonReducer from './reducers/common';
import fileReducer from './reducers/file';

const styles = {
  root: {
    position: 'absolute',
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
  geometryFactory: GeometryFactory;
  commonState: CommonState;
  onCommonStateChange: (commonState: CommonState) => any;
  fileState: FileState;
  onFileStateChange: (fileState: FileState) => any;
  onApply?: () => any;
  sizeVersion: number;
  extraData: ExtraData;
  focus: boolean;
  onMouseDown: (e: MouseEvent) => any;
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
  static createFileState = createFileState;
  static deserialize = deserialize;

  static createCommonState: () => CommonState;
  static createExtraData: (size: Position) => ExtraData;
  static isModified: (lhs: ModelEditorState, rhs: ModelEditorState) => boolean;
  static serialize: (fileState: FileState) => Uint8Array;
  static importBmfFile: (buffer: ArrayBuffer) => ImportFileResult;
  static importVoxFile: (buffer: ArrayBuffer) => ImportFileResult;
  static exportVoxFile: (fileState: FileState) => ExportFileResult;

  canvas: ModelEditorCanvas;

  private keyboard: Keyboard;

  constructor(props) {
    super(props);

    this.keyboard = new Keyboard();

    this.state = {
      fullscreen: screenfull.enabled && screenfull.isFullscreen,
    };
  }

  dispatchAction = (action: Action<any>, callback?: () => any) => {
    let prevCommonState = this.props.commonState;
    let prevFileState = this.props.fileState;

    const nextCommonState = commonReducer(this.props.commonState, action);
    if (this.props.commonState !== nextCommonState) this.props.onCommonStateChange(nextCommonState);

    const nextFileState = fileReducer(this.props.fileState, action);
    if (this.props.fileState !== nextFileState) this.props.onFileStateChange(nextFileState);

    if (__DEV__) {
      console.log('[VoxelEditor] Dispatch action:', action);

      if (prevCommonState !== nextCommonState) {
        console.log('[VoxelEditor] Common state change', prevCommonState, '->', nextCommonState);
      }

      if (prevFileState !== nextFileState) {
        console.log('[VoxelEditor] File state change', prevFileState.present.data, '->', nextFileState.present.data);
      }
    }
  }

  handleFullscreenButtonClick = () => {
    if (screenfull.isFullscreen) {
      screenfull.exit();
    } else {
      screenfull.request(findDOMNode<HTMLElement>(this.refs['root']));
    }
  }

  getEditorState(): ModelEditorState {
    return {
      common: this.props.commonState,
      file: this.props.fileState,
    };
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (!this.props.focus) return;

    e.preventDefault();

    switch(e.keyCode) {
      case 8: // Backspace
      case 46: // delete
      {
        if (this.props.fileState.present.data.selection) {
          if (this.props.fileState.present.data.mode2d.enabled) {
            this.dispatchAction(voxelRemoveSelected2d());
          } else {
            this.dispatchAction(voxelRemoveSelected());
          }
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
    } else {
      // Without CTRL or COMMAND + SHIFT
      switch(e.keyCode) {
        case 66: // B
        {
          if (this.props.fileState.present.data.mode2d.enabled) {
            this.dispatchAction(changeTool2d(ToolType.PENCIL_2D));
          } else {
            this.dispatchAction(changeTool3d(ToolType.PENCIL_3D));
          }
          break;
        }
        case 68: // D
        {
          if (this.props.fileState.present.data.mode2d.enabled) {
            this.dispatchAction(leaveMode2D());
          } else {
            this.dispatchAction(enterMode2D());
          }
          break;
        }
        case 69: // E
        {
          if (this.props.fileState.present.data.mode2d.enabled) {
            this.dispatchAction(changeTool2d(ToolType.ERASE_2D));
          } else {
            this.dispatchAction(changeTool3d(ToolType.ERASE_3D));
          }
          break;
        }
        case 71: // G
        {
          if (this.props.fileState.present.data.mode2d.enabled) {
            this.dispatchAction(changeTool2d(ToolType.COLOR_FILL_2D));
          } else {
            this.dispatchAction(changeTool3d(ToolType.COLOR_FILL_3D));
          }
          break;
        }
        case 73: // I
        {
          if (this.props.fileState.present.data.mode2d.enabled) {
            this.dispatchAction(changeTool2d(ToolType.COLORIZE_2D));
          } else {
            this.dispatchAction(changeTool3d(ToolType.COLORIZE_3D));
          }
          break;
        }
        case 77: // M
        {
          if (this.props.fileState.present.data.mode2d.enabled) {
            this.dispatchAction(changeTool2d(ToolType.RECTANGLE_SELECT_2D));
          } else {
            this.dispatchAction(changeTool3d(ToolType.RECTANGLE_SELECT_3D));
          }
          break;
        }
        case 82: // R
        {
          if (this.props.fileState.present.data.mode2d.enabled) {
            this.dispatchAction(changeTool2d(ToolType.RECTANGLE_2D));
          } else {
            this.dispatchAction(changeTool3d(ToolType.RECTANGLE_3D));
          }
          break;
        }
        case 86: // V
        {
          if (this.props.fileState.present.data.mode2d.enabled) {
            this.dispatchAction(changeTool2d(ToolType.MOVE_2D));
          } else {
            this.dispatchAction(changeTool3d(ToolType.MOVE_3D));
          }
          break;
        }
        case 87: // W
        {
          if (this.props.fileState.present.data.mode2d.enabled) {
            this.dispatchAction(changeTool2d(ToolType.MAGIC_WAND_2D));
          } else {
            this.dispatchAction(changeTool3d(ToolType.MAGIC_WAND_3D));
          }
          break;
        }
      }
    }
  };

  handleFullscreenChange = () => {
    if (this.state.fullscreen !== screenfull.isFullscreen) {
      this.setState({ fullscreen: screenfull.isFullscreen }, () => this.canvas.resize());
    }
  }

  componentDidMount() {
    this.canvas = new ModelEditorCanvas({
      container: findDOMNode<HTMLElement>(this.refs['canvas']),
      camera: this.props.extraData.camera,
      dispatchAction: this.dispatchAction,
      state: this.getEditorState(),
      keyboard: this.keyboard,
      geometryFactory: this.props.geometryFactory,
    });
    this.canvas.init();

    document.addEventListener('keydown', this.handleKeyDown, false);
    document.addEventListener(screenfull.raw.fullscreenchange, this.handleFullscreenChange, false);
  }

  componentDidUpdate(prevProps: ModelEditorProps) {
    if (prevProps.sizeVersion !== this.props.sizeVersion) {
      this.canvas.resize();
    }

    if (prevProps.extraData !== this.props.extraData) {
      this.canvas.onChangeCamera(this.props.extraData.camera, this.props.fileState.present.data.size);
    }

    if (this.props.fileState !== prevProps.fileState) {
      this.canvas.onStateChange(this.getEditorState());
    } else if (this.props.commonState !== prevProps.commonState) {
      this.canvas.onStateChange(this.getEditorState());
    }
  }

  componentWillUnmount() {
    this.canvas.destroy();
    document.removeEventListener('keydown', this.handleKeyDown, false);
    document.removeEventListener(screenfull.raw.fullscreenchange, this.handleFullscreenChange, false);
    this.keyboard.dispose();
  }

  selectTool = (selectedTool: ToolType) => this.dispatchAction(changeTool3d(selectedTool));

  selectTool2d = (selectedTool: ToolType) => this.dispatchAction(changeTool2d(selectedTool));

  changePaletteColor = (paletteColor: Color) => this.dispatchAction(changePaletteColor(paletteColor));

  handleEnableMode2D = (enabled: boolean) => {
    if (enabled) {
      this.dispatchAction(enterMode2D());
    } else {
      this.dispatchAction(leaveMode2D());
    }
  }

  renderPanels() {
    return (
      <div>
        <HistoryPanel
          voxel={this.props.fileState}
          dispatchAction={this.dispatchAction}
        />
        <ToolsPanel
          mode2d={this.props.fileState.present.data.mode2d.enabled}
          onEnableMode2D={this.handleEnableMode2D}
          paletteColor={this.props.commonState.paletteColor}
          selectedTool={this.props.commonState.tool3d}
          changePaletteColor={this.changePaletteColor}
          selectTool={this.selectTool}
          selectTool2d={this.selectTool2d}
          tool2d={this.props.commonState.tool2d}
        />
      </div>
    );
  }

  render() {
    return (
      <div ref="root" style={styles.root} onMouseDown={this.props.onMouseDown}>
        <div style={styles.canvas} ref="canvas"></div>
        <Tips />
        {screenfull.enabled && (
          <FullscreenButton
            onTouchTap={this.handleFullscreenButtonClick}
            fullscreen={this.state.fullscreen}
          />
        )}
        {this.props.onApply ? <ApplyButton
          onTouchTap={this.props.onApply}
        /> : null}
        {this.renderPanels()}
      </div>
    );
  }
}

ModelEditor.createCommonState = () => {
  return commonReducer(undefined, { type: '' });
};

const radius = PIXEL_SCALE * 50, theta = 135, phi = 30;

ModelEditor.createExtraData = (size: Position) => {
  const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -30000, 30000);

  camera.position.set(
    radius * Math.cos(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360)
      + size[0] * PIXEL_SCALE / 2,
    radius * Math.sin(phi * Math.PI / 360)
      + size[1] * PIXEL_SCALE / 4,
    radius * Math.sin(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360)
      + size[2] * PIXEL_SCALE / 2
  );

  camera.zoom = 0.3;

  return {
    camera,
  };
};

ModelEditor.isModified = function (lhs: FileState, rhs: FileState) {
  return lhs.present !== rhs.present;
};

const FILE_FORMAT_VERSION = '1.0';

ModelEditor.serialize = (fileState) => {
  const data: any = pako.deflate(fileState.present.data.model.data.buffer);

  return msgpack.encode({
    version: FILE_FORMAT_VERSION,
    data,
    shape: fileState.present.data.model.shape,
  });
}

ModelEditor.importBmfFile = buffer => {
  try {
    return {
      result: ModelEditor.deserialize(new Uint8Array(buffer)),
    };
  } catch(error) {
    return { error };
  }
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
        mode2d: {
          enabled: false,
          initialized: false,
          axis: Axis.X,
          position: 0,
        }
      }),
    };
  }
}

ModelEditor.exportVoxFile = fileState => {
  return exportVoxFile(fileState.present.data.model);
};

ModelEditor.createFileState = createFileState;
ModelEditor.deserialize = deserialize;

export default ModelEditor;
