import * as React from 'react';
const pure = require('recompose/pure').default;

import { findDOMNode } from 'react-dom';
import * as ReactDnd from 'react-dnd';
import RaisedButton from 'material-ui/lib/raised-button';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
const objectAssign = require('object-assign');
import AppBar from 'material-ui/lib/app-bar';
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

import {
  undoSeek,
  redoSeek,
  INIT,
  Snapshot,
} from '@pasta/helper/lib/undoable';

import { connectSource } from '../../../Panel';

import {
  PanelTypes,
  Panels,
} from '../../panel';

import {
  FileState,
  DispatchAction,
} from '../../types';

import {
  VOXEL_ADD_BATCH,
  VOXEL_REMOVE_BATCH,
  VOXEL_SELECT_PROJECTION,
  VOXEL_SELECT_BOX,
  VOXEL_SELECT_CONNECTED,
  VOXEL_MAGIN_WAND,
  VOXEL_CREATE_FRAGMENT,
  VOXEL_MOVE_FRAGMENT,
  VOXEL_MERGE_FRAGMENT,
  VOXEL_REMOVE_SELECTED,
  VOXEL_CLEAR_SELECTION,
  VOXEL_RESIZE,
  VOXEL_TRANSFORM,
  VOXEL_COLOR_FILL,
  VOXEL_ADD_LIST,
  VOXEL_PAINT,
  VOXEL_PASTE,
} from '../../actions';

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
  labelVoxelSelect: {
    id: 'voxel-editor.panels.history.voxel.select',
    description: 'Voxel select change history label',
    defaultMessage: 'Selection change',
  },
  labelVoxelMove: {
    id: 'voxel-editor.panels.history.voxel.move',
    description: 'Voxel move history label',
    defaultMessage: 'Move voxels',
  },
  labelVoxelMoveFinish: {
    id: 'voxel-editor.panels.history.voxel.move.finish',
    description: 'Voxel move finish history label',
    defaultMessage: 'Move finish',
  },
  labelVoxelResize: {
    id: 'voxel-editor.panels.history.voxel.move.resize',
    description: 'Voxel resize history label',
    defaultMessage: 'Canvas resize',
  },
  labelVoxelTransform: {
    id: 'voxel-editor.panels.history.voxel.transform',
    description: 'Voxel transform label',
    defaultMessage: 'Transform',
  },
  labelVoxelColorFill: {
    id: 'voxel-editor.panels.history.voxel.color.fill',
    description: 'Voxel color fill label',
    defaultMessage: 'Paint',
  },
  labelVoxelPaste: {
    id: 'voxel-editor.panels.history.voxel.paste',
    description: 'Voxel paste label',
    defaultMessage: 'Paste',
  },
});

const ActionMessages = {
  [INIT]: messages.labelVoxelInit,
  [VOXEL_ADD_BATCH]: messages.labelVoxelAdd,
  [VOXEL_ADD_LIST]: messages.labelVoxelAdd,
  [VOXEL_REMOVE_BATCH]: messages.labelVoxelRemove,
  [VOXEL_REMOVE_SELECTED]: messages.labelVoxelRemove,
  [VOXEL_SELECT_PROJECTION]: messages.labelVoxelSelect,
  [VOXEL_SELECT_BOX]: messages.labelVoxelSelect,
  [VOXEL_SELECT_CONNECTED]: messages.labelVoxelSelect,
  [VOXEL_MAGIN_WAND]: messages.labelVoxelSelect,
  [VOXEL_CLEAR_SELECTION]: messages.labelVoxelSelect,
  [VOXEL_CREATE_FRAGMENT]: messages.labelVoxelMove,
  [VOXEL_MOVE_FRAGMENT]: messages.labelVoxelMove,
  [VOXEL_MERGE_FRAGMENT]: messages.labelVoxelMoveFinish,
  [VOXEL_RESIZE]: messages.labelVoxelResize,
  [VOXEL_TRANSFORM]: messages.labelVoxelTransform,
  [VOXEL_COLOR_FILL]: messages.labelVoxelColorFill,
  [VOXEL_PAINT]: messages.labelVoxelColorFill,
  [VOXEL_PASTE]: messages.labelVoxelPaste,
};

function getActionMessage(state: Snapshot<any>) {
  const action = state.actionAlias || state.action;
  const message = ActionMessages[action];
  if (!message) throw new Error(`Cannot find message for action ${action}`);
  return message;
}

/*
 * Container
 */

interface HistoryPanelProps extends React.Props<HistoryPanel> {
  voxel: FileState;
  dispatchAction: DispatchAction;
}

@connectSource({
  panelTypes: PanelTypes,
  panelId: Panels.history,
  title: messages.title,
})
class HistoryPanel extends React.Component<HistoryPanelProps, {}> {
  componentDidUpdate() {
    if (this.props.voxel.future.length === 0) {
      const list = findDOMNode(this.refs['list']);
      list.scrollTop = list.scrollHeight;
    }
  };

  handleUndoClick(historyIndex: number) {
    this.props.dispatchAction(undoSeek(historyIndex));
  }

  handleRedoClick(historyIndex: number) {
    this.props.dispatchAction(redoSeek(historyIndex));
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
        <FormattedMessage {...getActionMessage(state)} />
      </div>;
    }).concat([
      <div style={objectAssign({ backgroundColor: '#ccc' }, styles.listItem)} key={voxel.present.historyIndex}>
        <FormattedMessage {...getActionMessage(voxel.present)} />
      </div>
    ]).concat(voxel.future.map(state => {
      return <div style={styles.listItem} key={state.historyIndex}
        onClick={() => this.handleRedoClick(state.historyIndex)}>
        <FormattedMessage {...getActionMessage(state)} />
      </div>;
    }));

    return (
      <div ref="list" style={{ height: 180, overflow: 'scroll'}}>
        {listItems}
      </div>
    );
  };
};

export default HistoryPanel;
