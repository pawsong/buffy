import * as React from 'react';
import { findDOMNode } from 'react-dom';
import {
  RaisedButton,
} from 'material-ui';
import objectAssign = require('object-assign');

import List = require('material-ui/lib/lists/list');
import ListItem = require('material-ui/lib/lists/list-item');

import * as ReactDnd from 'react-dnd';

import {
  PanelConstants,
  PanelStyles,
  wrapPanel
} from './Panel';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as VoxelActions from '../actions/voxel';

interface HistoryPanelProps extends React.Props<HistoryPanel> {
  actions: any;
  voxel: any;
  left: number;
  top: number;
  zIndex: number;
  connectDragPreview: ReactDnd.ConnectDragPreview;
  connectDragSource: ReactDnd.ConnectDragSource;
  isDragging: boolean;
}

class HistoryPanel extends React.Component<HistoryPanelProps, {}> {
  _clickUndo(historyIndex) {
    this.props.actions.voxelUndoSeek(historyIndex);
  };

  _clickRedo(historyIndex) {
    this.props.actions.voxelRedoSeek(historyIndex);
  };

  componentDidUpdate() {
    if (this.props.voxel.historyIndex === this.props.voxel.present.historyIndex) {
      const list = findDOMNode(this.refs['list']);
      list.scrollTop = list.scrollHeight;
    }
  };

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
      <div style={objectAssign({ backgroundColor: '#ccc' }, styles.listItem)} key={voxel.present.historyIndex}>
        {voxel.present.action}
      </div>
    ]).concat(voxel.future.map(state => {
      return <div style={styles.listItem} key={state.historyIndex}
        onClick={this._clickRedo.bind(this, state.historyIndex)}>
        {state.action}
      </div>;
    }));
    
    const previewStyle = objectAssign({ zIndex, left, top, opacity, display: 'table', height: 200 }, PanelStyles.root);

    return <div>
      {connectDragPreview(<div style={previewStyle}>
        {connectDragSource(<div style={PanelStyles.handle}>History</div>)}
        <div ref="list" style={{ height: 200 - PanelStyles.handle.height, overflow: 'scroll'}}>
          {listItems}
        </div>
      </div>)}
    </div>;
  };
};

export default connect(state => ({
  voxel: state.voxel,
}), dispatch => ({
  actions: bindActionCreators(objectAssign({}, 
    VoxelActions
  ), dispatch),
}))(wrapPanel(HistoryPanel));