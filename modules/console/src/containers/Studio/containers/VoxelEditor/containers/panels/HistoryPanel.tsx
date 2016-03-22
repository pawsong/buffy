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
  PanelBodyProps,
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

interface HistoryPanelProps extends React.Props<HistoryPanel>, PanelBodyProps {
  voxel?: VoxelState;
  voxelUndoSeek?: (historyIndex: number) => any;
  voxelRedoSeek?: (historyIndex: number) => any;
}

@wrapPanel({
  title: messages.title,
})
@connect((state: State) => ({
  voxel: state.voxelEditor.voxel,
}), {
  voxelUndoSeek,
  voxelRedoSeek,
})
class HistoryPanel extends React.Component<HistoryPanelProps, {}> {
  componentDidUpdate() {
    if (this.props.voxel.historyIndex === this.props.voxel.present.historyIndex) {
      const list = findDOMNode(this.refs['list']);
      list.scrollTop = list.scrollHeight;
    }
  };

  handleUndoClick(historyIndex: number) {
    this.props.voxelUndoSeek(historyIndex);
  }

  handleRedoClick(historyIndex: number) {
    this.props.voxelRedoSeek(historyIndex);
  }

  render() {
    const { voxel } = this.props;

    const styles = {
      listItem: {
        cursor: 'pointer',
      },
    };

    const listItems = voxel.past.map(state => {
      return <div style={styles.listItem} key={state.historyIndex}
        onClick={() => this.handleUndoClick(state.historyIndex)}>
        {state.action}
      </div>;
    }).concat([
      <div style={objectAssign({ backgroundColor: '#ccc' }, styles.listItem)} key={voxel.present.historyIndex}>
        {voxel.present.action}
      </div>
    ]).concat(voxel.future.map(state => {
      return <div style={styles.listItem} key={state.historyIndex}
        onClick={() => this.handleRedoClick(state.historyIndex)}>
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

export default HistoryPanel;
