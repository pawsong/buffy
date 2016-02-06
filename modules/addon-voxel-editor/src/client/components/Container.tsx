import * as React from 'react';
import * as ReactDOM from 'react-dom';
import update = require('react-addons-update');
import { bindActionCreators } from 'redux';
import { Provider, connect } from 'react-redux';
import { DropTarget, DragDropContext } from 'react-dnd';
import * as HTML5Backend from 'react-dnd-html5-backend';
const mapValues = require('lodash.mapvalues');
import objectAssign = require('object-assign');

import StateLayer from '@pasta/core/lib/StateLayer';
import connectStateLayer from '@pasta/components/lib/stateLayer/connect';

const ThemeManager = require('material-ui/lib/styles/theme-manager');
const LightRawTheme = require('material-ui/lib/styles/raw-themes/light-raw-theme');
import RaisedButton = require('material-ui/lib/raised-button');

import GreedyMesh from '../canvas/meshers/greedy';
import {
  rgbToHex,
  voxelMapToArray,
} from '../canvas/utils';

import FullscreenButton from './FullscreenButton';

import { initCanvas } from '../canvas';

import store from '../store';
import ToolsPanel from './ToolsPanel';
import WorkspacePanel from './WorkspacePanel';
import HistoryPanel from './HistoryPanel';
import PreviewPanel from './PreviewPanel';

import * as ColorActions from '../actions/color';

import * as storage from 'store';

const styles = {
  voxel: {
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

interface ContainerProps extends React.Props<React.ClassicComponentClass<ContainerProps>> {
   stateLayer?: StateLayer;
   connectDropTarget?: any;
   workspace?: any;
   voxel?: any;
}

interface ContainerStates {
  panels?: any;
  fullscreen?: boolean;
}

@connectStateLayer()
class Container extends React.Component<ContainerProps, ContainerStates> {
  // TypeScript jsx parser omits adding displayName when using decorator
  static displayName = 'Container';

  canvas: any;

  constructor(props) {
    super(props);

    let index = 0;
    const panels = mapValues(PANELS, (Component, id) => {
      const panel = storage.get(`panels.${id}`) || {};

      return {
        id,
        show: true,
        top: panel.top || 0,
        left: panel.left || 0,
        order: ++index,
        component: Component,
      };
    });

    const fullscreen = storage.get('fullscreen');
    this.state = {
      panels,
      fullscreen: fullscreen || false,
    };
  };

  movePanel(id, left, top) {
    const { order } = this.state.panels[id];

    const values = {};
    const panelKeys = Object.keys(this.state.panels);
    panelKeys.forEach(key => {
      const panel = this.state.panels[key];
      if (panel.order > order) {
        values[key] = { $merge: { order: panel.order - 1 } };
      }
    });
    values[id] = { $merge: { order: panelKeys.length, left, top } };

    this.setState(update(this.state, { panels: values }), () => {
      storage.set(`panels.${id}`, { left, top });
    });
  };

  _handleToggleFullscreen() {
    if (this.state.fullscreen) {
      this.setState({ fullscreen: false }, () => window.dispatchEvent(new Event('resize')));
      storage.set(`fullscreen`, false);
    } else {
      this.setState({ fullscreen: true }, () => window.dispatchEvent(new Event('resize')));
      storage.set(`fullscreen`, true);
    }
  };

  _submit() {
    const { stateLayer, voxel } = this.props;

    const voxelData = voxelMapToArray(voxel.present.data);
    const result = GreedyMesh(voxelData.data, voxelData.shape);

    stateLayer.rpc.updateMesh({
      id: stateLayer.store.myId,
      vertices: result.vertices,
      faces: result.faces,
    });
  };

  componentDidMount() {
    this.canvas = initCanvas(this.refs['canvas']);
  }

  componentWillUnmount() {
    this.canvas.destroy();
  }

  render() {
    const {
      connectDropTarget,
      workspace,
    } = this.props;

    const workspaceName = workspace.name || '(Untitled)';

    const panels = Object.keys(this.state.panels)
      .map(key => this.state.panels[key])
      .filter(panel => panel.show)
      .sort(panel => panel.order)
      .map(panel => {
        return React.createElement(panel.component, {
          key: panel.id,
          id: panel.id,
          left: panel.left,
          top: panel.top,
          zIndex: panel.order,
        });
      });

    const style = this.state.fullscreen ? {
      position: 'fixed',
      top: 0, left: 0, bottom: 0, right: 0,
      zIndex: 1,
    } : {
      width: '100%',
      height: '100%',
    };

    return connectDropTarget(<div style={style}>
      <div ref="canvas" style={ styles.voxel }></div>
      <div style={{ position: 'absolute', top: 15, right: 15 }}>
        <div>
          <RaisedButton label="Submit" primary={true} onClick={this._submit.bind(this)}/>
        </div>
      </div>
      <div style={{ position: 'absolute', top: 15, left: 15 }}>
        {workspaceName} workspace
      </div>
      <FullscreenButton
        onClick={this._handleToggleFullscreen.bind(this)}
        fullscreen={this.state.fullscreen}
        style={{
          position: 'absolute',
          bottom: 10,
        }}></FullscreenButton>
      {panels}
    </div>);
  };
};

export const DndContainer = DragDropContext<ContainerProps>(HTML5Backend)(
  DropTarget('panel', {
    drop(props, monitor, component: Container) {
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
  }))(Container)
);

export default connect(state => ({
  voxel: state.voxel,
  color: state.color,
  workspace: state.workspace,
}), dispatch => ({
  actions: bindActionCreators(objectAssign({},
    ColorActions
  ), dispatch),
}))(DndContainer);
