import * as React from 'react';
import { connect } from 'react-redux';

import { State } from '../../../../reducers';

// OrbitControls patch
require('./OrbitControls');

import { bindActionCreators } from 'redux';
import { DropTarget, DragDropContext } from 'react-dnd';
const HTML5Backend = require('react-dnd-html5-backend');
const update = require('react-addons-update');
import { EventEmitter, EventSubscription } from 'fbemitter';
const mapValues = require('lodash/mapValues');
const objectAssign = require('object-assign');
import * as invariant from 'invariant';
import RaisedButton from 'material-ui/lib/raised-button';

import * as StorageKeys from '../../../../constants/StorageKeys';

import StateLayer from '@pasta/core/lib/StateLayer';
import mesher from './canvas/meshers/greedy';

import {
  rgbToHex,
  voxelMapToArray,
} from './canvas/utils';

import ToolsPanel from './containers/panels/ToolsPanel';
import WorkspacePanel from './containers/panels/WorkspacePanel';
import HistoryPanel from './containers/panels/HistoryPanel';
import PreviewPanel from './containers/panels/PreviewPanel';

import WorkspaceBrowserDialog from './containers/dialogs/WorkspaceBrowserDialog';
import SaveDialog from './containers/dialogs/SaveDialog';
import NotImplDialog from './containers/dialogs/NotImplDialog';

import FullscreenButton from './components/FullscreenButton';

import initCanvasShared from './canvas/shared';
import initCanvas from './canvas/views/main';

import { VoxelState } from '../../../../reducers/voxelEditor';
import { saga, SagaProps, ImmutableTask } from '../../../../saga';
import { select, call, put } from 'redux-saga/effects';

import { connect as connectStateLayer } from '../../../../containers/stateLayer';

import {
  pushSnackbar,
} from '../../../../actions/snackbar';

const styles = {
  canvas: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
  },
};

const PANELS = {
  tools: ToolsPanel,
  workspace: WorkspacePanel,
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

interface VoxelEditorProps extends React.Props<VoxelEditor>, SagaProps {
  sizeVersion: number;
  stateLayer: StateLayer;
  connectDropTarget?: any;
  workspace?: any;
  submit?: ImmutableTask<any>;
}

interface ContainerStates {
  panels?: PanelState[];
  fullscreen?: boolean;
}

@saga({
  submit: function* (stateLayer: StateLayer, id: string) {
    const voxel: VoxelState = yield select<State>(state => state.voxelEditor.voxel);

    const voxelData = voxelMapToArray(voxel.present.data);
    const result = mesher(voxelData.data, voxelData.shape);

    yield call(stateLayer.rpc.updateMesh, {
      id,
      vertices: result.vertices,
      faces: result.faces,
    });

    yield put(pushSnackbar({
      message: 'Mesh updated',
    }));
  },
})
@connect((state: State) => ({
  workspace: state.voxelEditor.workspace,
}))
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
  middleware: any;
  store: any;
  canvasShared;
  canvas;

  static contextTypes: { [index: string]: any } = {
    middleware: React.PropTypes.func.isRequired,
    store: React.PropTypes.object.isRequired,
  }

  constructor(props, context) {
    super(props, context);
    this.middleware = this.context['middleware'];

    invariant(this.middleware,
      `Could not find "middleware" in the context of "VoxelEditor". ` +
      `Wrap the root component in a <SagaProvider>.`
    );

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
    this.props.runSaga(this.props.submit, this.props.stateLayer, this.props.stateLayer.store.myId);
  }

  componentWillMount() {
    this.canvasShared = initCanvasShared({
      sagaMiddleware: this.middleware,
      store: this.store,
    });
  }

  componentDidMount() {
    this.canvas = initCanvas(
      this.refs['canvas'] as HTMLElement,
      this.context['store'],
      this.canvasShared
    );
  }

  componentWillReceiveProps(nextProps: VoxelEditorProps) {
    if (nextProps.sizeVersion !== this.props.sizeVersion) {
      this.canvas.resize();
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

    const workspaceName = this.props.workspace.name || '(Untitled)';

    return (
      <div>
        {this.props.connectDropTarget(
          <div style={style}>
            <div style={styles.canvas} ref="canvas"></div>
            <div style={{ position: 'absolute', top: 15, right: 15 }}>
              <div>
                <RaisedButton label="Submit" primary={true} onTouchTap={() => this.handleSubmit()}/>
              </div>
            </div>
            <div style={{ position: 'absolute', top: 15, left: 15 }}>
              {workspaceName} workspace
            </div>
            <FullscreenButton
              onTouchTap={() => this.handleFullscreenButtonClick()}
              fullscreen={this.state.fullscreen}
            />
            {panels}
          </div>
        )}
        <WorkspaceBrowserDialog />
        <NotImplDialog />
        <SaveDialog />
      </div>
    );
  }
}

export default VoxelEditor;
