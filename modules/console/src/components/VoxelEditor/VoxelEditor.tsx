import * as React from 'react';
import { findDOMNode } from 'react-dom';

import * as Immutable from 'immutable';

// OrbitControls patch
// require('./OrbitControls');

import { DropTarget, DragDropContext } from 'react-dnd';
const HTML5Backend = require('react-dnd-html5-backend');
const update = require('react-addons-update');
import { EventEmitter, EventSubscription } from 'fbemitter';
const mapValues = require('lodash/mapValues');
const objectAssign = require('object-assign');
import * as invariant from 'invariant';
import RaisedButton from 'material-ui/lib/raised-button';

import { defineMessages, FormattedMessage, injectIntl, InjectedIntlProps } from 'react-intl';
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

import ToolsPanel from './components/panels/ToolsPanel';
// import WorkspacePanel from './containers/panels/WorkspacePanel';
import HistoryPanel from './components/panels/HistoryPanel';
import PreviewPanel from './components/panels/PreviewPanel';

// import WorkspaceBrowserDialog from './containers/dialogs/WorkspaceBrowserDialog';
// import SaveDialog from './containers/dialogs/SaveDialog';
// import NotImplDialog from './containers/dialogs/NotImplDialog';

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

const PANELS = {
  tools: ToolsPanel,
  // workspace: WorkspacePanel,
  history: HistoryPanel,
  preview: PreviewPanel,
};

interface PanelData {
  top: number;
  left: number;
}

interface PanelState {
  id: string;
  show: boolean;
  top: number;
  left: number;
  order: number;
  component: React.Component<{}, {}>;
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
  // workspace?: any;
  intl?: InjectedIntlProps;
}

interface ContainerStates {
  panels?: PanelState[];
  fullscreen?: boolean;
}

export interface CreateStateOptions {
  voxels?: any;
}

@injectIntl
@(DragDropContext<VoxelEditorProps>(HTML5Backend) as any)
@(DropTarget<VoxelEditorProps>('panel', {
  drop(props, monitor, component: VoxelEditor) {
    const item = monitor.getItem() as {
      left: number; top: number; id: string;
    };
    const delta = monitor.getDifferenceFromInitialOffset();
    const left = Math.round(item.left + delta.x);
    const top = Math.round(item.top + delta.y);
    component.movePanel(item.id, left, top);
  }
}, connect => ({
  connectDropTarget: connect.dropTarget()
})) as any)
class VoxelEditor extends React.Component<VoxelEditorProps, ContainerStates> {
  static createState: (options?: CreateStateOptions) => VoxelEditorState;

  canvasShared: CanvasShared;
  canvas: MainCanvas;

  constructor(props) {
    super(props);

    this.state = {
      panels: [],
      fullscreen: false,
    };

    let index = 0;
    const panels: PanelState[] = mapValues(PANELS, (Component, id) => {
      let panel = {} as PanelData;
      const savedPanel = localStorage.getItem(`${StorageKeys.VOXEL_EDITOR_PANEL_PREFIX}.${id}`);
      if (savedPanel) {
        try {
          panel = JSON.parse(savedPanel);
        } catch(err) {}
      }

      return {
        id,
        show: true,
        top: panel.top || 0,
        left: panel.left || 0,
        order: ++index,
        component: Component,
      };
    });

    this.state = {
      panels,
      fullscreen: false,
    };
  }

  handleStateChange(editorState: VoxelEditorState) {
    this.props.onChange(objectAssign({}, this.props.editorState, editorState));
  }

  dispatchVoxelAction(action: Action<any>) {
    const voxel = voxelReducer(this.props.editorState.voxel, action);
    this.handleStateChange({ voxel });
  }

  movePanel(id, left, top) {
    const { order } = this.state.panels[id];
    this.moveToTop(id);
    this.setState(update(this.state, {
      panels: {
        [id]: { $merge: { left, top } },
      },
    }), () => {
      localStorage.setItem(`${StorageKeys.VOXEL_EDITOR_PANEL_PREFIX}.${id}`, JSON.stringify(this.state.panels[id]));
    });
  }

  moveToTop(id: string) {
    const { order } = this.state.panels[id];

    const values = {};
    const panelKeys = Object.keys(this.state.panels);
    panelKeys.forEach(key => {
      const panel = this.state.panels[key];
      if (panel.order > order) {
        values[key] = { $merge: { order: panel.order - 1 } };
      }
    });
    values[id] = { $merge: { order: panelKeys.length } };
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

    if (this.props.editorState !== nextProps.editorState) {
      this.canvas.updateState(nextProps.editorState);
    }

    if (this.props.editorState.voxel !== nextProps.editorState.voxel) {
      this.canvasShared.voxelStateChange(nextProps.editorState.voxel);
    }
  }

  componentWillUnmount() {
    this.canvas.destroy();
  }

  render() {
    const panels = Object.keys(this.state.panels)
      .map(key => this.state.panels[key])
      .filter(panel => panel.show)
      .sort(panel => panel.order)
      .map(panel => React.createElement(panel.component, {
        key: panel.id,
        id: panel.id,
        left: panel.left,
        top: panel.top,
        zIndex: panel.order,
        editorState: this.props.editorState,
        onChange: this.props.onChange,
        dispatchAction: (action: Action<any>) => this.dispatchVoxelAction(action),
        canvasShared: this.canvasShared,
        sizeVersion: this.props.sizeVersion,
        moveToTop: (id: string) => this.moveToTop(id),
      }));

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
            {panels}
          </div>
        )}
      </div>
    );

    // <WorkspaceBrowserDialog />
    // <NotImplDialog />
    // <SaveDialog />
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
