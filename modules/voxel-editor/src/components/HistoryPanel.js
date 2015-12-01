import React from 'react';
import { findDOMNode } from 'react-dom';
import rasterizeHTML from 'rasterizehtml';
import {
  RaisedButton,
} from 'material-ui';

const List = require('material-ui/lib/lists/list');
const ListItem = require('material-ui/lib/lists/list-item');

import {
  PanelConstants,
  PanelStyles,
  wrapPanel
} from './Panel';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as VoxelActions from '../actions/voxel';

const HistoryPanel = React.createClass({
  _clickUndo(historyIndex) {
    this.props.actions.voxelUndoSeek(historyIndex);
  },

  _clickRedo(historyIndex) {
    this.props.actions.voxelRedoSeek(historyIndex);
  },

  componentDidUpdate() {
    if (this.props.voxel.historyIndex === this.props.voxel.present.historyIndex) {
      const list = findDOMNode(this.refs.list);
      list.scrollTop = list.scrollHeight;
    }
  },

  render() {
    const {
      left,
      top,
      zIndex,
      connectDragPreview,
      connectDragSource,
      isDragging,
      voxel,
    } = this.props;

    const opacity = isDragging ? PanelConstants.DRAGGING_OPACITY : 1;

    const styles = {
      listItem: {
        cursor: 'pointer',
      },
    };

    const listItems = voxel.past.map(state => {
      return <div style={styles.listItem} key={state.historyIndex}
        onClick={this._clickUndo.bind(this, state.historyIndex)}>
        {state.action}
      </div>;
    }).concat([
      <div style={{...styles.listItem, backgroundColor: '#ccc' }} key={voxel.present.historyIndex}>
        {voxel.present.action}
      </div>
    ]).concat(voxel.future.map(state => {
      return <div style={styles.listItem} key={state.historyIndex}
        onClick={this._clickRedo.bind(this, state.historyIndex)}>
        {state.action}
      </div>;
    }));

    return <div>
      {connectDragPreview(<div style={{ ...PanelStyles.root, zIndex, left, top, opacity, display: 'table', height: 200 }}>
        {connectDragSource(<div style={PanelStyles.handle}>History</div>)}
        <div ref="list" style={{ height: 200 - PanelStyles.handle.height, overflow: 'scroll'}}>
          {listItems}
        </div>
      </div>)}
    </div>;
  },

});

export default connect(state => ({
  voxel: state.voxel,
}), dispatch => ({
  actions: bindActionCreators({
    ...VoxelActions,
  }, dispatch),
}))(wrapPanel(HistoryPanel));
