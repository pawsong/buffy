import React from 'react';
import ReactDOM from 'react-dom';
import update from 'react/lib/update';
import { Provider } from 'react-redux';
import { DropTarget, DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';
import _ from 'lodash';

import {
  IconButton,
  FontIcon,
  Styles,
} from 'material-ui';

const {
  ThemeManager,
  LightRawTheme,
  ThemeDecorator,
} = Styles;

import initVoxelView from '../views/voxel';

import Controls from './Controls';
import store from '../store';
import Panel from './Panel';
import SpritePanel from './SpritePanel';
import ToolsPanel from './ToolsPanel';

import objectAssign from 'object-assign';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';

import * as ColorActions from '../actions/color';
import * as SpriteActions from '../actions/sprite';

const styles = {
  voxel: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
  },
};

const PANELS = {
  sprite: {
    title: 'Sprite',
    content: props => <SpritePanel/>,
  },
  tools: {
    title: 'Tools',
    content: props => <ToolsPanel color={props.color} actions={props.actions}/>,
  },
};

const Container = React.createClass({
  _voxelRef(element) {
    initVoxelView(element, element);
  },

  //the key passed through context must be called "muiTheme"
  childContextTypes : {
    muiTheme: React.PropTypes.object,
  },

  getChildContext() {
    const CustomRawTheme = _.cloneDeep(LightRawTheme);
    CustomRawTheme.spacing.iconSize = 36;
    return { muiTheme: ThemeManager.getMuiTheme(CustomRawTheme) };
  },

  getInitialState() {
    const panels = {};
    Object.keys(PANELS).forEach((id, index) => {
      const panel = PANELS[id];
      panels[id] = objectAssign({
        show: true,
        top: 100,
        left: 100,
        order: index + 1,
      }, panel, { id });
    });

    return {
      panels,
      fullscreen: false,
    };
  },

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

    this.setState(update(this.state, {
      panels: values,
    }));
  },

  _handleToggleFullscreen() {
    if (this.state.fullscreen) {
      this.setState({ fullscreen: false }, () => window.dispatchEvent(new Event('resize')));
    } else {
      this.setState({ fullscreen: true }, () => window.dispatchEvent(new Event('resize')));
    }
  },

  render() {
    const { connectDropTarget } = this.props;

    const panels = Object.keys(this.state.panels)
      .map(key => this.state.panels[key])
      .filter(panel => panel.show)
      .sort(panel => panel.order)
      .map(panel => {
        const Content = panel.content(this.props);
        return <Panel key={panel.id} id={panel.id}
          left={panel.left}
          top={panel.top}
          title={panel.title}
          order={panel.order}>{Content}</Panel>;
      });

    const style = this.state.fullscreen ? {
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      right: 0,
      zIndex: 1,
    } : {
      width: '100%',
      height: '100%',
    };

    return connectDropTarget(<div style={style}>
      <div ref={this._voxelRef} style={ styles.voxel }></div>
      <Controls submit={this.props.submit} />
      <IconButton
        onClick={this._handleToggleFullscreen}
        tooltipStyles={{ left: 5 }}
        style={{
          position: 'absolute',
          bottom: 10,
        }} iconClassName="material-icons" tooltipPosition="bottom-center"
        tooltip={this.state.fullscreen ? 'Fullscreen exit' : 'fullscreen'}
        >
        {this.state.fullscreen ? 'fullscreen_exit' : 'fullscreen'}
      </IconButton>
      {panels}
    </div>);
  },
});

const DndContainer = DragDropContext(HTML5Backend)(
  DropTarget('panel', {
    drop(props, monitor, component) {
      const item = monitor.getItem();
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
  sprite: state.sprite,
}), dispatch => ({
  actions: bindActionCreators({
    ...SpriteActions,
    ...ColorActions,
  }, dispatch),
}))(DndContainer);
