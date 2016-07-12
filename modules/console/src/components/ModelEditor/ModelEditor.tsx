import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { grey600 } from 'material-ui/styles/colors';
const pure = require('recompose/pure').default;

import THREE from 'three';

import JSZip from 'jszip';
import * as pako from 'pako';

import * as Immutable from 'immutable';

import pascalCase from 'pascal-case';

import { DropTarget } from 'react-dnd';
const HTML5Backend = require('react-dnd-html5-backend');
const update = require('react-addons-update');
import { EventEmitter, EventSubscription } from 'fbemitter';
import RaisedButton from 'material-ui/RaisedButton';
import { reset, undo, redo } from '@pasta/helper/lib/undoable';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';

import * as ndarray from 'ndarray';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./ModelEditor.css');

import mapinfo from './mapinfo';

const msgpack = require('msgpack-lite');

import { serialize, deserialize } from './utils/serdez';

import troveMap from './ndops/troveMap';

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
import getUniqueToolType from './utils/getUniqueToolType';

import {
  importVoxFile,
  exportVoxFile,
  importQbFile,
  exportQbFile,
} from './io';

import {
  rgbToHex,
} from './canvas/utils';

import {
  PIXEL_SCALE,
} from '../../canvas/Constants';

import GeometryFactory from '../../canvas/GeometryFactory';
import TroveGeometryFactory from '../../canvas/TroveGeometryFactory';

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
  ColorPickerType,
  ImportResult,
  ExportResult,
  TroveMetaData,
  TroveItemType,
} from './types';

import {
  ModelFileType,
  MaterialMapType,
} from '../../types';

import troveItemType from './trove/itemType';

import {
  changeTool,
  changePaletteColor,
  voxelRemoveSelected2d,
  voxelRemoveSelected,
  voxelMergeFragment,
  voxelClearSelection,
  voxelCopy,
  voxelPaste,
  enterMode2D,
  leaveMode2D,
  editAsTrove,
  activateMap,
  changeColorPicker,
  troveItemTypeChange,
} from './actions';

import HistoryPanel from './components/panels/HistoryPanel';
import ToolsPanel from './components/panels/ToolsPanel';
import MapPanel from './components/panels/MapPanel';
import Sidebar from './components/Sidebar';

import FullscreenButton from './components/FullscreenButton';
import ApplyButton from './components/ApplyButton';
import Tips from './components/Tips';

import ModelEditorCanvas from './canvas/ModelEditorCanvas';

import commonReducer from './reducers/common';
import fileReducer from './reducers/file';

import {
  PanelTypes,
  Panels,
} from './panel';

export { ModelEditorState };

interface ModelEditorProps extends React.Props<ModelEditor> {
  geometryFactory: GeometryFactory;
  troveGeometryFactory: TroveGeometryFactory;
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
  size?: Position;
}

interface ImportFileResult {
  result?: FileState;
  error?: string;
}

interface ExportFileResult {
  extension: string;
  data: Uint8Array;
}

@pure
@injectIntl
@connectTarget({
  panelTypes: PanelTypes,
  panelIds: Object.keys(Panels).map(key => Panels[key]),
  mapIdToLocalStorageKey: panelId => `${StorageKeys.VOXEL_EDITOR_PANEL_PREFIX}.${panelId}`,
})
@withStyles(styles)
class ModelEditor extends React.Component<ModelEditorProps, ContainerStates> {
  static createFileState = createFileState;

  static editAsTrove: (fileState: FileState) => FileState;

  static createCommonState: () => CommonState;
  static createExtraData: (size: Position) => ExtraData;
  static isModified: (lhs: ModelEditorState, rhs: ModelEditorState) => boolean;
  static serialize = serialize;
  static deserialize = deserialize;
  static importBmfFile: (buffer: ArrayBuffer) => ImportFileResult;
  static importVoxFile: (buffer: ArrayBuffer) => ImportFileResult;
  static importQbFile: (buffer: ArrayBuffer) => ImportFileResult;
  static exportVoxFile: (fileState: FileState, filename: string, username: string) => Promise<ExportFileResult>;
  static exportQbFile: (fileState: FileState, filename: string, username: string) => Promise<ExportFileResult>;

  canvas: ModelEditorCanvas;

  private keyboard: Keyboard;

  constructor(props) {
    super(props);

    this.keyboard = new Keyboard();

    this.state = {
      fullscreen: screenfull.enabled && screenfull.isFullscreen,
      size: null,
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
            const { selection } = this.props.fileState.present.data;
            const { maps} = this.props.fileState.present.data;

            if (selection) {
              if (!clipboard || clipboard.maps !== maps || clipboard.selection !== selection) {
                this.dispatchAction(voxelCopy(maps, selection));
              }
            }
            break;
          }
          case 86: // V
          {
            const { clipboard } = this.props.commonState;
            if (clipboard) {
              this.dispatchAction(voxelPaste(clipboard.maps, clipboard.selection));
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
          this.dispatchAction(changeTool(ToolType.PENCIL));
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
          this.dispatchAction(changeTool(ToolType.ERASE));
          break;
        }
        case 71: // G
        {
          this.dispatchAction(changeTool(ToolType.COLOR_FILL));
          break;
        }
        case 73: // I
        {
          this.dispatchAction(changeTool(ToolType.COLORIZE));
          break;
        }
        case 77: // M
        {
          this.dispatchAction(changeTool(ToolType.RECTANGLE_SELECT));
          break;
        }
        case 82: // R
        {
          this.dispatchAction(changeTool(ToolType.RECTANGLE));
          break;
        }
        case 86: // V
        {
          this.dispatchAction(changeTool(ToolType.MOVE));
          break;
        }
        case 87: // W
        {
          this.dispatchAction(changeTool(ToolType.MAGIC_WAND));
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
      troveGeometryFactory: this.props.troveGeometryFactory,
      onTemporarySizeUpdate: this.handleTemporarySizeUpdate,
    });
    this.canvas.init();

    document.addEventListener('keydown', this.handleKeyDown, false);
    document.addEventListener(screenfull.raw.fullscreenchange, this.handleFullscreenChange, false);
  }

  componentWillReceiveProps() {
    if (this.state.size) this.setState({ size: null });
  }

  handleTemporarySizeUpdate = (size: Position) => {
    if (
         !this.state.size
      || this.state.size[0] !== size[0]
      || this.state.size[1] !== size[1]
      || this.state.size[2] !== size[2]
    ) {
      this.setState({ size });
    }
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

  selectTool = (selectedTool: ToolType) => this.dispatchAction(changeTool(selectedTool));

  changePaletteColor = (paletteColor: Color) => this.dispatchAction(
    changePaletteColor(this.props.fileState.present.data.activeMap, paletteColor)
  );

  handleEnableMode2D = (enabled: boolean) => {
    if (enabled) {
      this.dispatchAction(enterMode2D());
    } else {
      this.dispatchAction(leaveMode2D());
    }
  }

  handleActivateMap = (activeMap: MaterialMapType) => {
    this.dispatchAction(activateMap(activeMap));
  }

  handleChangeColorPicker = (colorPicker: ColorPickerType) => {
    this.dispatchAction(changeColorPicker(colorPicker));
  }

  renderPanels() {
    return (
      <div>
        <HistoryPanel
          voxel={this.props.fileState}
          dispatchAction={this.dispatchAction}
        />
        <ToolsPanel
          fileType={this.props.fileState.present.data.type}
          activeMap={this.props.fileState.present.data.activeMap}
          colorPicker={this.props.commonState.colorPicker}
          mode2d={this.props.fileState.present.data.mode2d.enabled}
          onEnableMode2D={this.handleEnableMode2D}
          paletteColor={this.props.commonState.paletteColors[this.props.fileState.present.data.activeMap]}
          selectedTool={
            getUniqueToolType(this.props.fileState.present.data.mode2d.enabled, this.props.commonState.tool)
          }
          changePaletteColor={this.changePaletteColor}
          selectTool={this.selectTool}
          onChangeColorPicker={this.handleChangeColorPicker}
        />
        {this.props.fileState.present.data.type === ModelFileType.TROVE ? (
          <MapPanel
            activeMap={this.props.fileState.present.data.activeMap}
            onActivateMap={this.handleActivateMap}
          />
        ) : null}
      </div>
    );
  }

  handleTroveItemTypeChange = (itemType: TroveItemType) => this.dispatchAction(troveItemTypeChange(itemType));

  render() {
    return (
      <div ref="root" className={styles.root} onMouseDown={this.props.onMouseDown}>
        <div className={styles.main}>
          <div className={styles.canvas} ref="canvas"></div>
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
        <Sidebar
          fileType={this.props.fileState.present.data.type}
          trove={this.props.fileState.present.data.trove}
          size={this.state.size || this.props.fileState.present.data.size}
          onTroveItemTypeChange={this.handleTroveItemTypeChange}
        />
      </div>
    );
  }
}

ModelEditor.createCommonState = () => {
  return commonReducer(undefined, { type: '' });
};

const radius = PIXEL_SCALE * 500, theta = 135, phi = 30;

ModelEditor.createExtraData = (size: Position) => {
  const camera = new THREE.OrthographicCamera(0, 0, 0, 0, -100000, 100000);

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

ModelEditor.importBmfFile = buffer => {
  try {
    return {
      result: ModelEditor.deserialize(new Uint8Array(buffer)),
    };
  } catch(error) {
    return { error };
  }
}

function importFile({ error, result }: ImportResult): ImportFileResult {
  if (error) {
    return { error };
  } else {
    return {
      result: ModelEditor.createFileState({
        type: ModelFileType.DEFAULT,
        size: result.shape,
        maps: {
          [MaterialMapType.DEFAULT]: result,
        },
        activeMap: MaterialMapType.DEFAULT,
        selection: null,
        fragment: null,
        fragmentOffset: [0, 0, 0],
        mode2d: {
          enabled: false,
          initialized: false,
          axis: Axis.X,
          position: 0,
        },
        trove: {
          itemType: TroveItemType.SWORD,
        },
      }),
    };
  }
}

ModelEditor.importVoxFile = buffer => {
  return importFile(importVoxFile(buffer));
}

ModelEditor.importQbFile = buffer => {
  return importFile(importQbFile(buffer));
}

const TROVE_MAPS = [
  { type: MaterialMapType.TROVE_TYPE, postfix: 't' },
  { type: MaterialMapType.TROVE_ALPHA, postfix: 'a' },
  { type: MaterialMapType.TROVE_SPECULAR, postfix: 's' },
];

function exportFile(
  fileState: FileState, filename: string, username: string, extension: string, exporter: (data: ndarray.Ndarray) => ExportResult
) {
  return Promise.resolve().then<ExportFileResult>(() => {
    switch(fileState.present.data.type) {
      case ModelFileType.TROVE: {
        const zip = new JSZip();

        const finalFilename =
          `${troveItemType[fileState.present.data.trove.itemType].typename}_${pascalCase(filename)}_${username}`;
        let result: ExportResult;

        // Default
        const defaultMap = fileState.present.data.maps[MaterialMapType.DEFAULT];
        result = exporter(defaultMap);
        if (result.error) throw result.error;
        zip.file(`${finalFilename}.${extension}`, result.result);

        for (let i = 0; i < TROVE_MAPS.length; ++i) {
          const { type, postfix } = TROVE_MAPS[i];
          const map = fileState.present.data.maps[type];

          const processedMap = ndarray(map.data.slice(), map.shape);
          troveMap(processedMap, defaultMap, mapinfo[type].defaultColor);

          result = exporter(processedMap);
          if (result.error) throw result.error;

          zip.file(`${finalFilename}_${postfix}.${extension}`, result.result);
        }

        return zip.generateAsync({ type: 'uint8array' }).then(data => ({ extension: 'zip', data }));
      }
      default: {
        const { error, result } = exporter(fileState.present.data.maps[MaterialMapType.DEFAULT]);
        if (error) throw(error);
        return { extension, data: result };
      }
    }
  });
}

ModelEditor.exportVoxFile = (fileState, filename, username) => {
  return exportFile(fileState, filename, username, 'vox', exportVoxFile);
};

ModelEditor.exportQbFile = (fileState, filename, username) => {
  return exportFile(fileState, filename, username, 'qb', exportQbFile);
};

ModelEditor.createFileState = createFileState;

ModelEditor.serialize = serialize;
ModelEditor.deserialize = deserialize;

ModelEditor.editAsTrove = (fileState: FileState): FileState => {
  return fileReducer(fileState, editAsTrove());
}

export default ModelEditor;
