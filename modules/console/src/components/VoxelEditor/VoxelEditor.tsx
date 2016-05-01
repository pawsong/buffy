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
import Panel from './components/panels/Panel';

import Messages from '../../constants/Messages';

import * as StorageKeys from '../../constants/StorageKeys';

import mesher from './canvas/meshers/greedy';

import {
  rgbToHex,
  voxelMapToArray,
} from './canvas/utils';

import {
  VoxelState,
} from './interface';

import { PanelProps } from './components/panels/Panel';
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

import PanelType from './components/panels/PanelType';

const PANELS = {
  tools: ToolsPanel,
  history: HistoryPanel,
  preview: PreviewPanel,
};

interface PanelData {
  top: number;
  left: number;
}

interface PanelState {
  // id: string;
  show: boolean;
  top: number;
  left: number;
  order: number;
  // component: React.Component<{}, {}>;
}

import {
  Action,
  ToolType,
  Color,
  VoxelEditorState,
} from './interface';

export { VoxelEditorState };

interface VoxelEditorProps extends React.Props<VoxelEditor> {
  editorState: VoxelEditorState;
  onChange: (voxelEditorState: VoxelEditorState) => any;
  sizeVersion: number;
  onSubmit: (data) => any;
  connectDropTarget?: any;
  intl?: InjectedIntlProps;
}

interface ContainerStates {
  panels?: { [index: number]: PanelState },
  fullscreen?: boolean;
}

export interface CreateStateOptions {
  voxels?: any;
}

const panelTarget = {
  drop(props: VoxelEditorProps, monitor, component: VoxelEditor) {
    const item = monitor.getItem() as {
      left: number; top: number; panelType: PanelType;
    };
    const delta = monitor.getDifferenceFromInitialOffset();
    const left = Math.round(item.left + delta.x);
    const top = Math.round(item.top + delta.y);
    component.movePanel(item.panelType, left, top);
  },
};

@pure
@injectIntl
@(DropTarget('panel', panelTarget, connect => ({
  connectDropTarget: connect.dropTarget()
})) as any)
class VoxelEditor extends React.Component<VoxelEditorProps, ContainerStates> {
  static createState: (options?: CreateStateOptions) => VoxelEditorState;

  canvasShared: CanvasShared;
  canvas: MainCanvas;

  constructor(props) {
    super(props);

    this.state = {
      panels: {},
      fullscreen: false,
    };

    let index = 0;
    Object.keys(PanelType)
      .map(v => parseInt(v, 10))
      .filter(v => !isNaN(v))
      .forEach(type => {
        const typeName = PanelType[type];
        let panel = {} as PanelData;
        const savedPanel = localStorage.getItem(`${StorageKeys.VOXEL_EDITOR_PANEL_PREFIX}.${typeName}`);
        if (savedPanel) {
          try {
            panel = JSON.parse(savedPanel);
          } catch(err) {}
        }

        this.state.panels[type] = {
          show: true,
          top: panel.top || 0,
          left: panel.left || 0,
          order: ++index,
        };
      });
  }

  handleStateChange(editorState: VoxelEditorState) {
    this.props.onChange(objectAssign({}, this.props.editorState, editorState));
  }

  dispatchVoxelAction = (action: Action<any>) => {
    const voxel = voxelReducer(this.props.editorState.voxel, action);
    this.handleStateChange({ voxel });
  }

  movePanel(type: PanelType, left, top) {
    const { order } = this.state.panels[type];
    this.moveToTop(type);
    this.setState(update(this.state, {
      panels: {
        [type]: { $merge: { left, top } },
      },
    }), () => {
      localStorage.setItem(`${StorageKeys.VOXEL_EDITOR_PANEL_PREFIX}.${PanelType[type]}`, JSON.stringify(this.state.panels[type]));
    });
  }

  moveToTop = (type: PanelType) => {
    const { order } = this.state.panels[type];

    const values = {};
    const panelKeys = Object.keys(this.state.panels);
    panelKeys.forEach(key => {
      const panel = this.state.panels[key];
      if (panel.order > order) {
        values[key] = { $merge: { order: panel.order - 1 } };
      }
    });
    values[type] = { $merge: { order: panelKeys.length } };
    this.setState(update(this.state, { panels: values }));
  }

  handleFullscreenButtonClick() {
    this.setState({ fullscreen: !this.state.fullscreen }, () => this.canvas.resize());
  }

  handleSubmit() {
    const voxelData = voxelMapToArray(this.props.editorState.voxel.present.data);
    const result = mesher(voxelData.data, voxelData.shape);
    this.props.onSubmit(result);
  }

  componentWillMount() {
    this.props.editorState.voxel
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
          panelState={this.state.panels[PanelType.HISTORY]}
          moveToTop={this.moveToTop}
          voxel={this.props.editorState.voxel}
          dispatchAction={this.dispatchVoxelAction}
        />
        <PreviewPanel
          panelState={this.state.panels[PanelType.PREVIEW]}
          moveToTop={this.moveToTop}
          canvasShared={this.canvasShared}
          dispatchAction={this.dispatchVoxelAction}
          sizeVersion={this.props.sizeVersion}
        />
        <ToolsPanel
          panelState={this.state.panels[PanelType.TOOLS]}
          moveToTop={this.moveToTop}
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
      <div>
        {this.props.connectDropTarget(
          <div style={style}>
            <div style={styles.canvas} ref="canvas"></div>
            <div style={{ position: 'absolute', top: 15, right: 15 }}>
              <div>
                <RaisedButton
                  label={this.props.intl.formatMessage(Messages.apply)}
                  primary={true}
                  onTouchTap={() => this.handleSubmit()}
                />
              </div>
            </div>
            <FullscreenButton
              onTouchTap={() => this.handleFullscreenButtonClick()}
              fullscreen={this.state.fullscreen}
            />
            {this.renderPanels()}
          </div>
        )}
      </div>
    );
  }
}

VoxelEditor.createState = function VoxelEditor(options: CreateStateOptions = {}): VoxelEditorState {
  const voxel: VoxelState = options.voxels ? update(initialVoxelState, {
    present: { data: { $set: Immutable.Map(options.voxels), } },
  }) : initialVoxelState;

  return {
    selectedTool: ToolType.brush,
    paletteColor: { r: 104, g: 204, b: 202 },
    voxel,
  };
}

export default VoxelEditor;
