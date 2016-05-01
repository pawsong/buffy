import * as React from 'react';
import { DragSource, ConnectDragPreview, ConnectDragSource } from 'react-dnd';
const objectAssign = require('object-assign');
const update = require('react-addons-update');
import FontIcon from 'material-ui/lib/font-icon';
import AppBar from 'material-ui/lib/app-bar';
import Colors from 'material-ui/lib/styles/colors';
import { Styles } from 'material-ui';
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
import Paper from 'material-ui/lib/paper';
import PanelType from './PanelType';

import CanvasShared from '../../canvas/shared';

import {
  DispatchAction,
  VoxelEditorState,
} from '../../interface';

export const PanelConstants = {
  DRAGGING_OPACITY: 0.4,
}

export const PanelStyles = {
  height: 30,
  root: {
    position: 'absolute',
  },
  handle: {
    marginBottom: 6,
    cursor: 'move',
  },
  handleIcon: {
    marginTop: 13,
    fontSize: 22,
  },
  handleLabel: {
    fontSize: 18,
  },
  paper: {
    padding: 5,
  },
}

const styles = PanelStyles;

function getDisplayName(Component) {
  return Component.displayName || Component.name || 'Component';
}

export interface PanelState {
  show: boolean;
  top: number;
  left: number;
  order: number;
}

export interface MoveToTop {
  (panelType: PanelType): any;
}

export interface PanelProps extends React.Props<Panel> {
  panelType: PanelType;
  panelState: PanelState;
  moveToTop: MoveToTop;

  title: string;

  connectDragPreview?: ConnectDragPreview;
  connectDragSource?: ConnectDragSource;
  isDragging?: boolean;
}

const panelSource = {
  beginDrag(props: PanelProps) {
    return {
      panelType: props.panelType,
      left: props.panelState.left,
      top: props.panelState.top,
    };
  },
};

@(DragSource('panel', panelSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging(),
})) as any)
class Panel extends React.Component<PanelProps, {}> {
  static contextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
  } as any;

  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  } as any

  muiTheme: Styles.MuiTheme;

  constructor(props, context) {
    super(props, context);
    this.muiTheme = update(this.context['muiTheme'], {
      appBar: { height: { $set: styles.height } },
    });
  }

  getChildContext() {
    return { muiTheme: this.muiTheme };
  }

  moveToTop = () => this.props.moveToTop(this.props.panelType);

  render() {
    const { left, top, order } = this.props.panelState;
    const { connectDragPreview, connectDragSource, isDragging } = this.props;

    const opacity = isDragging ? PanelConstants.DRAGGING_OPACITY : 1;
    const previewStyle = objectAssign({ zIndex: order, left, top, opacity }, PanelStyles.root);

    return connectDragPreview(
      <div style={previewStyle} onClick={this.moveToTop}>
        <Paper style={styles.paper}>
          {connectDragSource(
            <div>
              <AppBar style={styles.handle}
                      title={this.props.title}
                      titleStyle={styles.handleLabel}
                      iconElementLeft={
                        <FontIcon className="material-icons" style={styles.handleIcon} color={Colors.white}>menu</FontIcon>
                      }
              />
            </div>
          )}
          {this.props.children}
        </Paper>
      </div>
    );
  }
}

export default Panel;
