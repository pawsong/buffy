import React from 'react';
import ReactDOM from 'react-dom';
import update from 'react/lib/update';
import { Provider } from 'react-redux';
import { DropTarget, DragDropContext } from 'react-dnd';
import HTML5Backend from 'react-dnd-html5-backend';

import initVoxelView from '../views/voxel';
import initSpriteView from '../views/sprite';

import Controls from './Controls';
import store from '../store';
import Panel from './Panel';
import SpritePanel from './SpritePanel';

import objectAssign from 'object-assign';

const styles = {
  voxel: {
    position: 'absolute',
    top: 0, left: 0, bottom: 0, right: 0,
  },
};

const PANELS = {
  a: { title: 'Panel A', content: SpritePanel },
};

const Container = React.createClass({
  _voxelRef(element) {
    initVoxelView(element, element);
  },

  _spriteRef(element) {
    initSpriteView(element);
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

  render() {
    const { connectDropTarget } = this.props;

    const panels = Object.keys(this.state.panels)
      .map(key => this.state.panels[key])
      .filter(panel => panel.show)
      .sort(panel => panel.order)
      .map(panel => {
        const Content = panel.content;
        return <Panel key={panel.id} id={panel.id}
          left={panel.left}
          top={panel.top}
          title={panel.title}
          order={panel.order}><Content/></Panel>;
      });

    return connectDropTarget(<div style={{ width: '100%', height: '100%' }}>
      <div ref={this._voxelRef} style={ styles.voxel }></div>
      <Controls submit={this.props.submit} rootElement={this.props.element}/>
      {panels}
    </div>);
  },
});

export default DragDropContext(HTML5Backend)(
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
