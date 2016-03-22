import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as ReactDnd from 'react-dnd';
import RaisedButton from 'material-ui/lib/raised-button';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
const objectAssign = require('object-assign');
import AppBar from 'material-ui/lib/app-bar';
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

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

const messages = defineMessages({
  title: {
    id: 'voxel-editor.panels.history.title',
    description: 'Voxel editor history panel title',
    defaultMessage: 'History',
  },
});

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

@wrapPanel({
  title: messages.title,
})
class HistoryPanel extends React.Component<HistoryPanelProps, {}> {
  componentDidUpdate() {
    if (this.props.voxel.historyIndex === this.props.voxel.present.historyIndex) {
      const list = findDOMNode(this.refs['list']);
      list.scrollTop = list.scrollHeight;
    }
  };

  render() {
    const { voxel } = this.props;

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

    return (
      <div>
        <div ref="list" style={{ height: 200 - PanelStyles.height, overflow: 'scroll'}}>
          {listItems}
        </div>
      </div>
    );
  };
};
