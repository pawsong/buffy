import * as React from 'react';
import { findDOMNode } from 'react-dom';
import Avatar from 'material-ui/lib/avatar';
import List from 'material-ui/lib/lists/list';
import ListItem from 'material-ui/lib/lists/list-item';
import IconButton from 'material-ui/lib/icon-button';
import MoreVertIcon from 'material-ui/lib/svg-icons/navigation/more-vert';
import AddCircleIcon from 'material-ui/lib/svg-icons/content/add-circle';
import IconMenu from 'material-ui/lib/menus/icon-menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import Colors from 'material-ui/lib/styles/colors';
import RaisedButton from 'material-ui/lib/raised-button';

import {
  undoSeek,
  redoSeek,
  INIT,
} from '@pasta/helper/lib/undoable';

import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
import * as classNames from 'classnames';

const styles = require('./EditMode.css');

import { connectSource } from '../../../Panel';
import { PanelTypes, Panels } from '../../panel';

import { SourceFileDB } from '../../../Studio/types';

import {
  Robot,
  FileState,
  DispatchAction,
} from '../../types';

import {
  ADD_ZONE_BLOCK,
  REMOVE_ZONE_BLOCK,
  ADD_ROBOT,
} from '../../actions';

const messages = defineMessages({
  title: {
    id: 'worldeditor.panels.history.title',
    description: 'World editor history panel title',
    defaultMessage: 'History',
  },
  labelInit: {
    id: 'worldeditor.panels.history.init',
    description: 'Init history label',
    defaultMessage: 'Initialize',
  },
  labelAddZoneBlock: {
    id: 'worldeditor.panels.history.add.zone.block',
    description: 'Zone block add history label',
    defaultMessage: 'Add block',
  },
  labelRemoveZoneBlock: {
    id: 'worldeditor.panels.history.remove.zone.block',
    description: 'Zone block remove history label',
    defaultMessage: 'Remove block',
  },
  labelAddRobot: {
    id: 'worldeditor.panels.history.add.robot',
    description: 'Add robot history label',
    defaultMessage: 'Add robot',
  },
});

const ActionMessages = {
  [INIT]: messages.labelInit,
  [ADD_ZONE_BLOCK]: messages.labelAddZoneBlock,
  [REMOVE_ZONE_BLOCK]: messages.labelRemoveZoneBlock,
  [ADD_ROBOT]: messages.labelAddRobot,
};

function getActionMessage(action: string) {
  const message = ActionMessages[action];
  if (!message) throw new Error(`Cannot find message for action ${action}`);
  return message;
}

const iconButtonElement = (
  <IconButton touch={true}>
    <MoreVertIcon color={Colors.grey400} />
  </IconButton>
);

const markForModifiedClass = classNames('material-icons', styles.markForModified);

interface HistoryPanelProps extends React.Props<HistoryPanel> {
  file: FileState;
  dispatchAction: DispatchAction;
  intl?: InjectedIntlProps;
}

@connectSource({
  panelTypes: PanelTypes,
  panelId: Panels.history,
  title: messages.title,
})
@injectIntl
class HistoryPanel extends React.Component<HistoryPanelProps, void> {
  componentDidUpdate() {
    if (this.props.file.future.length === 0) {
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
    const { file } = this.props;

    const styles = {
      listItem: {
        cursor: 'pointer',
      },
    };

    const listItems = file.past.map(state => {
      return <div style={styles.listItem} key={state.historyIndex}
        onClick={() => this.handleUndoClick(state.historyIndex)}>
        <FormattedMessage {...getActionMessage(state.action)} />
      </div>;
    }).concat([
      <div style={Object.assign({ backgroundColor: '#ccc' }, styles.listItem)} key={file.present.historyIndex}>
        <FormattedMessage {...getActionMessage(file.present.action)} />
      </div>
    ]).concat(file.future.map(state => {
      return <div style={styles.listItem} key={state.historyIndex}
        onClick={() => this.handleRedoClick(state.historyIndex)}>
        <FormattedMessage {...getActionMessage(state.action)} />
      </div>;
    }));

    return (
      <div ref="list" style={{ height: 180, overflow: 'scroll'}}>
        {listItems}
      </div>
    );
  };


  // render() {
  //   const listItems = Object.keys(this.props.robots).map(id => this.props.robots[id]).map(robot => {
  //     const recipe = this.props.files[robot.recipe];
  //     const thumbnail = this.props.modelThumbnails.get(recipe.state.design);

  //     const rightIconMenu = (
  //       <IconMenu iconButtonElement={iconButtonElement}>
  //         <MenuItem onTouchTap={() => this.props.onRobotRemove(robot.id)}>Delete</MenuItem>
  //       </IconMenu>
  //     );

  //     return (
  //       <ListItem
  //         key={robot.id}
  //         leftAvatar={<Avatar src={thumbnail} />}
  //         rightIconButton={rightIconMenu}
  //         primaryText={
  //           <span>
  //             {this.props.playerId === robot.id ? <i className={markForModifiedClass}>fiber_manual_record</i> : null}
  //             {robot.name || '(Untitled)'}
  //           </span>
  //         }
  //         secondaryText={recipe.name}
  //         onTouchTap={() => this.props.onPlayerChange(robot.id)}
  //       />
  //     );
  //   });

  //   return (
  //     <div>
  //       <List>{listItems}</List>
  //       <RaisedButton
  //         onTouchTap={this.props.onAddRobotButtonClick}
  //         label="Add robot"
  //         fullWidth={true}
  //         secondary={true}
  //         icon={<AddCircleIcon />}
  //       />
  //     </div>
  //   );
  // }
}

// export default HistoryPanel;






// import * as React from 'react';
// const pure = require('recompose/pure').default;

// import { findDOMNode } from 'react-dom';
// import * as ReactDnd from 'react-dnd';
// import RaisedButton from 'material-ui/lib/raised-button';
// import List from 'material-ui/lib/lists/list';
// import ListItem from 'material-ui/lib/lists/list-item';
// const objectAssign = require('object-assign');
// import AppBar from 'material-ui/lib/app-bar';
// import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

// import {
//   undoSeek,
//   redoSeek,
//   INIT,
// } from '@pasta/helper/lib/undoable';

// import { connectSource } from '../../../Panel';

// import {
//   PanelTypes,
//   Panels,
// } from '../../panel';

// import {
//   FileState,
//   DispatchAction,
// } from '../../types';

// import {
//   VOXEL_ADD_BATCH,
//   VOXEL_REMOVE_BATCH,
//   VOXEL_ROTATE,
// } from '../../actions';

// const messages = defineMessages({
//   title: {
//     id: 'voxel-editor.panels.history.title',
//     description: 'Voxel editor history panel title',
//     defaultMessage: 'History',
//   },
//   labelVoxelInit: {
//     id: 'voxel-editor.panels.history.voxel.init',
//     description: 'Voxel init history label',
//     defaultMessage: 'Initialize',
//   },
//   labelVoxelAdd: {
//     id: 'voxel-editor.panels.history.voxel.add',
//     description: 'Voxel add history label',
//     defaultMessage: 'Add voxels',
//   },
//   labelVoxelRemove: {
//     id: 'voxel-editor.panels.history.voxel.remove',
//     description: 'Voxel remove history label',
//     defaultMessage: 'Remove voxels',
//   },
//   labelVoxelRotate: {
//     id: 'voxel-editor.panels.history.voxel.rotate',
//     description: 'Voxel rotate history label',
//     defaultMessage: 'Rotate voxels',
//   },
// });

// const ActionMessages = {
//   [INIT]: messages.labelVoxelInit,
//   [VOXEL_ADD_BATCH]: messages.labelVoxelAdd,
//   [VOXEL_REMOVE_BATCH]: messages.labelVoxelRemove,
//   [VOXEL_ROTATE]: messages.labelVoxelRotate,
// };

// function getActionMessage(action: string) {
//   const message = ActionMessages[action];
//   if (!message) throw new Error(`Cannot find message for action ${action}`);
//   return message;
// }

// /*
//  * Container
//  */

// interface HistoryPanelProps extends React.Props<HistoryPanel> {
//   voxel: FileState;
//   dispatchAction: DispatchAction;
//   intl?: InjectedIntlProps;
// }

// @connectSource({
//   panelTypes: PanelTypes,
//   panelId: Panels.history,
//   title: messages.title,
// })
// @injectIntl
// class HistoryPanel extends React.Component<HistoryPanelProps, {}> {
//   componentDidUpdate() {
//     if (this.props.voxel.future.length === 0) {
//       const list = findDOMNode(this.refs['list']);
//       list.scrollTop = list.scrollHeight;
//     }
//   };

//   handleUndoClick(historyIndex: number) {
//     this.props.dispatchAction(undoSeek(historyIndex));
//   }

//   handleRedoClick(historyIndex: number) {
//     this.props.dispatchAction(redoSeek(historyIndex));
//   }

//   render() {
//     const { voxel } = this.props;

//     const styles = {
//       listItem: {
//         cursor: 'pointer',
//       },
//     };

//     const listItems = voxel.past.map(state => {
//       return <div style={styles.listItem} key={state.historyIndex}
//         onClick={() => this.handleUndoClick(state.historyIndex)}>
//         <FormattedMessage {...getActionMessage(state.action)} />
//       </div>;
//     }).concat([
//       <div style={objectAssign({ backgroundColor: '#ccc' }, styles.listItem)} key={voxel.present.historyIndex}>
//         <FormattedMessage {...getActionMessage(voxel.present.action)} />
//       </div>
//     ]).concat(voxel.future.map(state => {
//       return <div style={styles.listItem} key={state.historyIndex}
//         onClick={() => this.handleRedoClick(state.historyIndex)}>
//         <FormattedMessage {...getActionMessage(state.action)} />
//       </div>;
//     }));

//     return (
//       <div ref="list" style={{ height: 180, overflow: 'scroll'}}>
//         {listItems}
//       </div>
//     );
//   };
// };

export default HistoryPanel;
