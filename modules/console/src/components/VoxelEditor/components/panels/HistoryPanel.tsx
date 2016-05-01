import * as React from 'react';
import { findDOMNode } from 'react-dom';
import * as ReactDnd from 'react-dnd';
import RaisedButton from 'material-ui/lib/raised-button';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
const objectAssign = require('object-assign');
import AppBar from 'material-ui/lib/app-bar';
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

import {
  VoxelEditorState,
  DispatchAction,
} from '../../interface';

import {
  PanelConstants,
  PanelStyles,
  PanelBodyProps,
  wrapPanel
} from './Panel';

import {
  voxelUndoSeek,
  voxelRedoSeek,
  VOXEL_INIT,
  VOXEL_ADD_BATCH,
  VOXEL_REMOVE_BATCH,
  VOXEL_ROTATE,
} from '../../voxels/actions';

const messages = defineMessages({
  title: {
    id: 'voxel-editor.panels.history.title',
    description: 'Voxel editor history panel title',
    defaultMessage: 'History',
  },
  labelVoxelInit: {
    id: 'voxel-editor.panels.history.voxel.init',
    description: 'Voxel init history label',
    defaultMessage: 'Initialize',
  },
  labelVoxelAdd: {
    id: 'voxel-editor.panels.history.voxel.add',
    description: 'Voxel add history label',
    defaultMessage: 'Add voxels',
  },
  labelVoxelRemove: {
    id: 'voxel-editor.panels.history.voxel.remove',
    description: 'Voxel remove history label',
    defaultMessage: 'Remove voxels',
  },
  labelVoxelRotate: {
    id: 'voxel-editor.panels.history.voxel.rotate',
    description: 'Voxel rotate history label',
    defaultMessage: 'Rotate voxels',
  },
});

const ActionMessages = {
  [VOXEL_INIT]: messages.labelVoxelInit,
  [VOXEL_ADD_BATCH]: messages.labelVoxelAdd,
  [VOXEL_REMOVE_BATCH]: messages.labelVoxelRemove,
  [VOXEL_ROTATE]: messages.labelVoxelRotate,
};

function getActionMessage(action: string) {
  const message = ActionMessages[action];
  if (!message) throw new Error(`Cannot find message for action ${action}`);
  return message;
}

/*
 * Container
 */

interface HistoryPanelProps extends React.Props<HistoryPanel>, PanelBodyProps { }

@wrapPanel({
  title: messages.title,
})
class HistoryPanel extends React.Component<HistoryPanelProps, {}> {
  componentDidUpdate() {
    if (this.props.editorState.voxel.historyIndex === this.props.editorState.voxel.present.historyIndex) {
      const list = findDOMNode(this.refs['list']);
      list.scrollTop = list.scrollHeight;
    }
  };

  handleUndoClick(historyIndex: number) {
    this.props.dispatchAction(voxelUndoSeek(historyIndex));
  }

  handleRedoClick(historyIndex: number) {
    this.props.dispatchAction(voxelRedoSeek(historyIndex));
  }

  render() {
    const { voxel } = this.props.editorState;

    const styles = {
      listItem: {
        cursor: 'pointer',
      },
    };

    const listItems = voxel.past.map(state => {
      return <div style={styles.listItem} key={state.historyIndex}
        onClick={() => this.handleUndoClick(state.historyIndex)}>
        <FormattedMessage {...getActionMessage(state.action)} />
      </div>;
    }).concat([
      <div style={objectAssign({ backgroundColor: '#ccc' }, styles.listItem)} key={voxel.present.historyIndex}>
        <FormattedMessage {...getActionMessage(voxel.present.action)} />
      </div>
    ]).concat(voxel.future.map(state => {
      return <div style={styles.listItem} key={state.historyIndex}
        onClick={() => this.handleRedoClick(state.historyIndex)}>
        <FormattedMessage {...getActionMessage(state.action)} />
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
