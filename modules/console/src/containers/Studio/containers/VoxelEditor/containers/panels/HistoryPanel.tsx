import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as ReactDnd from 'react-dnd';
import RaisedButton = require('material-ui/lib/raised-button');
import List = require('material-ui/lib/lists/list');
import ListItem = require('material-ui/lib/lists/list-item');
import objectAssign = require('object-assign');

import {
  PanelConstants,
  PanelStyles,
  PanelProps,
  wrapPanel
} from './Panel';

import { State } from '../../../../../../reducers';
import { VoxelState } from '../../../../../../reducers/voxelEditor';
import {
  voxelUndoSeek,
  voxelRedoSeek,
} from '../../../../../../actions/voxelEditor';

/*
 * Container
 */

interface HistoryPanelContainerProps extends PanelProps<HistoryPanelContainer> {
  voxel: VoxelState;
  voxelUndoSeek: (historyIndex: number) => any,
  voxelRedoSeek: (historyIndex: number) => any,
}

@connect((state: State) => ({
  voxel: state.voxelEditor.voxel,
  // voxel: state.voxel,
}), {
  voxelUndoSeek,
  voxelRedoSeek,
})
class HistoryPanelContainer extends React.Component<HistoryPanelContainerProps, {}> {
  handleUndoClick(historyIndex: number) {
    this.props.voxelUndoSeek(historyIndex);
  }

  handleRedoClick(historyIndex: number) {
    this.props.voxelRedoSeek(historyIndex);
  }

  render() {
    const { left, top, zIndex } = this.props;
    return (
      <HistoryPanel id={this.props.id} left={this.props.left} top={this.props.top} zIndex={this.props.zIndex}
                    voxel={this.props.voxel}
                    onUndoClick={historyIndex => this.handleUndoClick(historyIndex)}
                    onRedoClick={historyIndex => this.handleRedoClick(historyIndex)}
      />
    );
  }
}

export default HistoryPanelContainer;

/*
 * Component
 */

interface HistoryPanelProps extends PanelProps<HistoryPanel> {
  connectDragPreview?: ReactDnd.ConnectDragPreview;
  connectDragSource?: ReactDnd.ConnectDragSource;
  isDragging?: boolean;

  voxel: VoxelState;
  onUndoClick: (historyIndex: number) => any;
  onRedoClick: (historyIndex: number) => any;
}

@wrapPanel
class HistoryPanel extends React.Component<HistoryPanelProps, {}> {
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
        onClick={() => this.props.onUndoClick(state.historyIndex)}>
        {state.action}
      </div>;
    }).concat([
      <div style={objectAssign({ backgroundColor: '#ccc' }, styles.listItem)} key={voxel.present.historyIndex}>
        {voxel.present.action}
      </div>
    ]).concat(voxel.future.map(state => {
      return <div style={styles.listItem} key={state.historyIndex}
        onClick={() => this.props.onRedoClick(state.historyIndex)}>
        {state.action}
      </div>;
    }));

    const previewStyle = objectAssign({ zIndex, left, top, opacity, display: 'table', height: 200 }, PanelStyles.root);
    return connectDragPreview(
      <div style={previewStyle}>
        {connectDragSource(<div style={PanelStyles.handle}>History</div>)}
        <div ref="list" style={{ height: 200 - PanelStyles.handle.height, overflow: 'scroll'}}>
          {listItems}
        </div>
      </div>
    );
  };
};
