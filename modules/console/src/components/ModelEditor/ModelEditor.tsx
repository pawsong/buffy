import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { grey600 } from 'material-ui/styles/colors';
import Paper from 'material-ui/Paper';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';
import Divider from 'material-ui/Divider';
const pure = require('recompose/pure').default;

import * as THREE from 'three';

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
  exportMeshFile,
  exportRawMeshFile,
} from './io';

import {
  rgbToHex,
} from './canvas/utils';

import {
  PIXEL_SCALE,
} from '../../canvas/Constants';

import GeometryFactory from '../../canvas/GeometryFactory';
import TroveGeometryFactory from '../../canvas/TroveGeometryFactory';

import ThumbnailFactory from '../../canvas/ThumbnailFactory';

import {
  FileState,
  VoxelData,
  Action,
  ToolType,
  ToolFilter,
  PanelType,
  PanelFilter,
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
  voxelResize,
  changePerspective,
  changeShowWireframe,
  changeBackgroundColor,
} from './actions';

import HistoryPanel from './components/panels/HistoryPanel';
import ToolsPanel from './components/panels/ToolsPanel';
import MapPanel from './components/panels/MapPanel';
import SettingsPanel from './components/panels/SettingsPanel';
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
  useSidebar: boolean;
  useContextMenu: boolean;
  toolFilter?: ToolFilter;
  panelFilter?: PanelFilter;
  dispatchActionPreHook?: (action: Action<any>) => Action<any>;
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

interface CreateCommonStateParams {
  tool: ToolType;
}

enum MouseState {
  IDLE,
  DOWN,
  MOVE,
}

const inlineStyles = {
  contextmenu: {
    position: 'absolute',
    transition: null,
    zIndex: 1000,
  },
  contextmenuItem: {
    transition: null,
  },
};

function isTargetInput(e: any): boolean {
  return e.target.type == 'textarea' || e.target.type == 'text' ||
         e.target.type == 'number' || e.target.type == 'email' ||
         e.target.type == 'password' || e.target.type == 'search' ||
         e.target.type == 'tel' || e.target.type == 'url' ||
         e.target.isContentEditable;
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
  static contextTypes = {
    isMac: React.PropTypes.bool.isRequired,
  };

  static createFileState = createFileState;

  static editAsTrove: (fileState: FileState) => FileState;

  static createCommonState: (params?: CreateCommonStateParams) => CommonState;
  static createExtraData: (size: Position) => ExtraData;
  static isModified: (lhs: ModelEditorState, rhs: ModelEditorState) => boolean;
  static serialize = serialize;
  static deserialize = deserialize;
  static importBmfFile: (buffer: ArrayBuffer) => ImportFileResult;
  static importVoxFile: (buffer: ArrayBuffer) => ImportFileResult;
  static importQbFile: (buffer: ArrayBuffer) => ImportFileResult;
  static exportVoxFile: (
    thumbnailFactory: ThumbnailFactory, fileState: FileState, filename: string, username: string
  ) => Promise<ExportFileResult>;
  static exportQbFile: (
    thumbnailFactory: ThumbnailFactory, fileState: FileState, filename: string, username: string
  ) => Promise<ExportFileResult>;
  static exportMeshFile: (
    thumbnailFactory: ThumbnailFactory, fileState: FileState, filename: string, username: string
  ) => Promise<ExportFileResult>;
  static exportRawMeshFile: (
    thumbnailFactory: ThumbnailFactory, fileState: FileState, filename: string, username: string
  ) => Promise<ExportFileResult>;

  canvas: ModelEditorCanvas;

  isMac: boolean;

  private keyboard: Keyboard;
  private mouseState: MouseState;
  private contextmenu: HTMLElement;
  private focused: boolean;

  constructor(props, context) {
    super(props, context);

    this.keyboard = new Keyboard();

    this.state = {
      fullscreen: screenfull.enabled && screenfull.isFullscreen,
      size: null,
    };

    this.mouseState = MouseState.IDLE;
    this.isMac = context.isMac;

    this.focused = false;
  }

  dispatchAction = (action: Action<any>) => {
    const finalAction = this.props.dispatchActionPreHook ? this.props.dispatchActionPreHook(action) : action;
    if (!finalAction) return;

    const prevCommonState = this.props.commonState;
    const prevFileState = this.props.fileState;

    const nextCommonState = commonReducer(this.props.commonState, finalAction);
    if (this.props.commonState !== nextCommonState) this.props.onCommonStateChange(nextCommonState);

    const nextFileState = fileReducer(this.props.fileState, finalAction);
    if (this.props.fileState !== nextFileState) this.props.onFileStateChange(nextFileState);

    if (__DEV__) {
      console.log('[VoxelEditor] Dispatch action:', finalAction);

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
    if (!this.focused) return;
    if (isTargetInput(e)) return;

    e.preventDefault();

    switch(e.keyCode) {
      case 8: // Backspace
      case 46: // delete
      {
        this.deleteSelectedBlocks();
        break;
      }
      case 27: // ESC
      {
        this.clearSelection();
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
            this.copy();
            break;
          }
          case 86: // V
          {
            this.paste();
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
          this.changeTool(ToolType.PENCIL);
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
          this.changeTool(ToolType.ERASE);
          break;
        }
        case 71: // G
        {
          this.changeTool(ToolType.COLOR_FILL);
          break;
        }
        case 73: // I
        {
          this.changeTool(ToolType.COLORIZE);
          break;
        }
        case 77: // M
        {
          this.changeTool(ToolType.RECTANGLE_SELECT);
          break;
        }
        case 82: // R
        {
          this.changeTool(ToolType.RECTANGLE);
          break;
        }
        case 86: // V
        {
          this.changeTool(ToolType.MOVE);
          break;
        }
        case 87: // W
        {
          this.changeTool(ToolType.MAGIC_WAND);
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
      cameraO: this.props.extraData.cameraO,
      cameraP: this.props.extraData.cameraP,
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

    this.contextmenu = findDOMNode<HTMLElement>(this.refs['contextmenu']);
    this.contextmenu.style.visibility = `hidden`;
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
      this.canvas.onChangeCamera(
        this.props.extraData.cameraO, this.props.extraData.cameraP, this.props.fileState.present.data.size
      );
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

  changeTool(tool: ToolType) {
    if (this.props.toolFilter && !this.props.toolFilter.has(tool)) return;
    this.dispatchAction(changeTool(tool));
  }

  selectTool = (selectedTool: ToolType) => this.changeTool(selectedTool);

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

  handleChangePerspective = (perspective: boolean) => {
    this.dispatchAction(changePerspective(perspective));
  }

  handleChangeShowWireframe = (showWireframe: boolean) => {
    this.dispatchAction(changeShowWireframe(showWireframe));
  }

  renderPanels() {
    return (
      <div>
        {(!this.props.panelFilter || this.props.panelFilter.has(PanelType.TOOLS)) && (
          <ToolsPanel
            toolFilter={this.props.toolFilter}
            fileType={this.props.fileState.present.data.type}
            activeMap={this.props.fileState.present.data.activeMap}
            colorPicker={this.props.commonState.colorPicker}
            mode2d={this.props.fileState.present.data.mode2d.enabled}
            onEnableMode2D={this.handleEnableMode2D}
            paletteColor={this.props.commonState.paletteColors[this.props.fileState.present.data.activeMap]}
            selectedTool={this.props.commonState.tool}
            changePaletteColor={this.changePaletteColor}
            selectTool={this.selectTool}
            onChangeColorPicker={this.handleChangeColorPicker}
          />
        )}
        {(!this.props.panelFilter || this.props.panelFilter.has(PanelType.HISTORY)) && (
          <HistoryPanel
            voxel={this.props.fileState}
            dispatchAction={this.dispatchAction}
          />
        )}
        {(!this.props.panelFilter || this.props.panelFilter.has(PanelType.SETTINGS)) && (
          <SettingsPanel
            showWireframe={this.props.commonState.showWireframe}
            onChangeShowWireframe={this.handleChangeShowWireframe}
            perspective={this.props.commonState.perspective}
            onSetPerspective={this.handleChangePerspective}
          />
        )}
        {(!this.props.panelFilter || this.props.panelFilter.has(PanelType.MAPS)) && (
          this.props.fileState.present.data.type === ModelFileType.TROVE && (
            <MapPanel
              activeMap={this.props.fileState.present.data.activeMap}
              onActivateMap={this.handleActivateMap}
            />
          )
        )}
      </div>
    );
  }

  handleTroveItemTypeChange = (itemType: TroveItemType) => this.dispatchAction(troveItemTypeChange(itemType));

  handleSizeChange = (width: number, height: number, depth: number) => {
    this.dispatchAction(voxelResize(width, height, depth, 0, 0, 0));
  }

  handleFocus = () => this.focused = true;

  handleBlur = () => this.focused = false;

  handleMouseDown = (e: React.MouseEvent) => {
    if (!this.focused) findDOMNode<HTMLElement>(this.refs['editor']).focus();
    this.contextmenu.style.visibility = `hidden`;
    this.mouseState = MouseState.DOWN;;
  }

  handleMouseMove = () => this.mouseState = MouseState.MOVE;

  handleMouseUp = (e: React.MouseEvent) => {
    const event = e.nativeEvent as MouseEvent;

    if (event.which === 3) {
      if (this.mouseState === MouseState.DOWN) {
        if (this.props.useContextMenu) {
          const canvas = event.target as HTMLElement;

          const left = this.contextmenu.clientWidth + event.offsetX < canvas.clientWidth
            ? event.offsetX : event.offsetX - this.contextmenu.clientWidth;

          const top = this.contextmenu.clientHeight + event.offsetY < canvas.clientHeight
            ? event.offsetY : event.offsetY - this.contextmenu.clientHeight;

          this.contextmenu.style.visibility = `visible`;
          this.contextmenu.style.top = `${top}px`;
          this.contextmenu.style.left = `${left}px`;
        }
      }
    }

    this.mouseState = MouseState.IDLE;
  }

  handleContextMenuCopy = () => {
    this.copy();
    this.contextmenu.style.visibility = `hidden`;
  }

  handleContextMenuPaste = () => {
    this.paste();
    this.contextmenu.style.visibility = `hidden`;
  }

  handleContextMenuClearSelection = () => {
    this.clearSelection();
    this.contextmenu.style.visibility = `hidden`;
  }

  handleContextMenuRemoveSelectedBlocks = () => {
    this.deleteSelectedBlocks();
    this.contextmenu.style.visibility = `hidden`;
  }

  copy() {
    const { selection } = this.props.fileState.present.data;

    if (selection) {
      const { clipboard } = this.props.commonState;
      const { maps } = this.props.fileState.present.data;

      if (!clipboard || clipboard.maps !== maps || clipboard.selection !== selection) {
        this.dispatchAction(voxelCopy(maps, selection));
      }
    }
  }

  paste() {
    const { clipboard } = this.props.commonState;

    if (clipboard) {
      this.dispatchAction(voxelPaste(clipboard.maps, clipboard.selection));
    }
  }

  clearSelection() {
    this.dispatchAction(voxelClearSelection());
  }

  deleteSelectedBlocks() {
    if (this.props.fileState.present.data.selection) {
      if (this.props.fileState.present.data.mode2d.enabled) {
        this.dispatchAction(voxelRemoveSelected2d());
      } else {
        this.dispatchAction(voxelRemoveSelected());
      }
    }
  }

  stopMouseEventPropagation = (e: React.MouseEvent) => e.stopPropagation();

  handleChangeBackgroundColor = (color: Color) => {
    this.dispatchAction(changeBackgroundColor(color));
  }

  render() {
    const shorcutKey = this.isMac ? '⌘' : 'Ctrl+';
    const esc = this.isMac ? 'esc' : 'Esc';
    const backspace = this.isMac ? 'delete' : 'Backspace';

    return (
      <div ref="root" className={styles.root}>
        <div
          className={this.props.useSidebar ? styles.main : styles.mainWithoutSidebar}
          ref="editor"
          tabIndex="-1"
          onFocus={this.handleFocus}
          onBlur={this.handleBlur}
          onMouseDown={this.handleMouseDown}
          onMouseMove={this.handleMouseMove}
          onMouseUp={this.handleMouseUp}
        >
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
          <Paper
            style={inlineStyles.contextmenu}
            ref="contextmenu"
            onMouseDown={this.stopMouseEventPropagation}
          >
            <Menu desktop={true} width={280}>
              <MenuItem
                primaryText="Copy"
                secondaryText={`${shorcutKey}C`}
                style={inlineStyles.contextmenuItem}
                disabled={!this.props.fileState.present.data.selection}
                onTouchTap={this.handleContextMenuCopy}
              />
              <MenuItem
                primaryText="Paste"
                secondaryText={`${shorcutKey}V`}
                style={inlineStyles.contextmenuItem}
                disabled={!this.props.commonState.clipboard}
                onTouchTap={this.handleContextMenuPaste}
              />
              <Divider />
              <MenuItem
                primaryText="Clear selection"
                secondaryText={esc}
                style={inlineStyles.contextmenuItem}
                disabled={!this.props.fileState.present.data.selection}
                onTouchTap={this.handleContextMenuClearSelection}
              />
              <MenuItem
                primaryText="Remove selected blocks"
                secondaryText={backspace}
                style={inlineStyles.contextmenuItem}
                disabled={!this.props.fileState.present.data.selection}
                onTouchTap={this.handleContextMenuRemoveSelectedBlocks}
              />
            </Menu>
          </Paper>
        </div>
        {this.props.useSidebar && (
          <Sidebar
            fileType={this.props.fileState.present.data.type}
            trove={this.props.fileState.present.data.trove}
            size={this.state.size || this.props.fileState.present.data.size}
            onTroveItemTypeChange={this.handleTroveItemTypeChange}
            onSizeChange={this.handleSizeChange}
            backgroundColor={this.props.commonState.backgroundColor}
            changeBackgroundColor={this.handleChangeBackgroundColor}
          />
        )}
      </div>
    );
  }
}

ModelEditor.createCommonState = (params?: CreateCommonStateParams) => {
  const state = commonReducer(undefined, { type: '' });
  return Object.assign({}, state, params);
};

const radius = PIXEL_SCALE * 500, theta = 135, phi = 30;

ModelEditor.createExtraData = (size: Position) => {
  const cameraO = new THREE.OrthographicCamera(0, 0, 0, 0, -100000, 100000);

  cameraO.position.set(
    radius * Math.cos(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360)
      + size[0] * PIXEL_SCALE / 2,
    radius * Math.sin(phi * Math.PI / 360)
      + size[1] * PIXEL_SCALE / 4,
    radius * Math.sin(theta * Math.PI / 360) * Math.cos(phi * Math.PI / 360)
      + size[2] * PIXEL_SCALE / 2
  );
  cameraO.zoom = 0.3;

  const cameraP = new THREE.PerspectiveCamera(70, 1, 1, 1000000);
  cameraP.position.copy(cameraO.position).multiplyScalar(cameraO.zoom / 4);

  return {
    cameraO, cameraP,
  };
};

ModelEditor.isModified = function (lhs: FileState, rhs: FileState) {
  return lhs.present !== rhs.present;
};

ModelEditor.importBmfFile = buffer => {
  try {
    return {
      result: ModelEditor.deserialize(new Uint8Array(buffer)).model,
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
  thumbnailFactory: ThumbnailFactory,
  fileState: FileState, filename: string, username: string, extension: string,
  exporter: (data: ndarray.Ndarray) => ExportResult
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

        const thumbnailUrl = thumbnailFactory.createThumbnail(fileState.present.data);
        zip.file('thumbnail.png', thumbnailUrl.substr(thumbnailUrl.indexOf(',') + 1), {base64: true});

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

ModelEditor.exportVoxFile = (thumbnailFactory, fileState, filename, username) => {
  return exportFile(thumbnailFactory, fileState, filename, username, 'vox', exportVoxFile);
};

ModelEditor.exportQbFile = (thumbnailFactory, fileState, filename, username) => {
  return exportFile(thumbnailFactory, fileState, filename, username, 'qb', exportQbFile);
};

ModelEditor.exportMeshFile = (thumbnailFactory, fileState, filename, username) => {
  return exportFile(thumbnailFactory, fileState, filename, username, 'msgpack', exportMeshFile);
};

ModelEditor.exportRawMeshFile = (thumbnailFactory, fileState, filename, username) => {
  return exportFile(thumbnailFactory, fileState, filename, username, 'msgpack', exportRawMeshFile);
};

ModelEditor.createFileState = createFileState;

ModelEditor.serialize = serialize;
ModelEditor.deserialize = deserialize;

ModelEditor.editAsTrove = (fileState: FileState): FileState => {
  return fileReducer(fileState, editAsTrove());
}

export default ModelEditor;
