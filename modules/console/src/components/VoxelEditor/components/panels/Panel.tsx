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
    // border: '1px dashed gray',
    // backgroundColor: 'white',
    // padding: '0.5rem 1rem',
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

interface PanelProps extends React.Props<any> {
  id: string;
  left: number;
  top: number;
  zIndex: number;
  moveToTop: (id: string) => any;
  canvasShared: any,
  sizeVersion: number;
  editorState: VoxelEditorState;
  onChange: (editorState: VoxelEditorState) => any;
  dispatchAction: DispatchAction;

  connectDragPreview?: ConnectDragPreview;
  connectDragSource?: ConnectDragSource;
  isDragging?: boolean;

  intl?: InjectedIntlProps;
}

export interface PanelBodyProps {
  id: string;
  moveToTop: (id: string) => any;
  canvasShared: CanvasShared;
  dispatchAction: DispatchAction;
  editorState: VoxelEditorState;
  sizeVersion: number;
}

interface PanelState {
  muiTheme: Styles.MuiTheme;
}

interface PanelOptions {
  title: FormattedMessage.MessageDescriptor;
}

export function wrapPanel(options: PanelOptions): any {
  return function (WrappedComponent) {
    @injectIntl
    class Panel extends React.Component<PanelProps, PanelState> {
      static displayName = `Panel(${getDisplayName(WrappedComponent)})`;

      static contextTypes = {
        muiTheme: React.PropTypes.object.isRequired,
      } as any;

      static childContextTypes = {
        muiTheme: React.PropTypes.object,
      } as any

      toolbarHeight: number;

      constructor(props, context) {
        super(props, context);
        this.state = { muiTheme: this.context['muiTheme'] };
      }

      getChildContext() {
        return { muiTheme: this.state.muiTheme };
      }

      componentWillMount () {
        this.setState({
          muiTheme: update(this.state.muiTheme, {
            appBar: { height: { $set: styles.height } },
          }),
        });
      }

      render() {
        const { left, top, zIndex } = this.props;
        const { connectDragPreview, connectDragSource, isDragging } = this.props;

        const opacity = isDragging ? PanelConstants.DRAGGING_OPACITY : 1;
        const previewStyle = objectAssign({ zIndex, left, top, opacity }, PanelStyles.root);

        return connectDragPreview(
          <div style={previewStyle}>
            <Paper style={styles.paper}>
              {connectDragSource(
                <div>
                  <AppBar style={styles.handle}
                          title={this.props.intl.formatMessage(options.title)}
                          titleStyle={styles.handleLabel}
                          iconElementLeft={
                            <FontIcon className="material-icons" style={styles.handleIcon} color={Colors.white}>menu</FontIcon>
                          }
                  />
                </div>
              )}
              <WrappedComponent id={this.props.id}
                                moveToTop={this.props.moveToTop}
                                canvasShared={this.props.canvasShared}
                                sizeVersion={this.props.sizeVersion}
                                dispatchAction={this.props.dispatchAction}
                                editorState={this.props.editorState}
                                onChange={this.props.onChange}
              />
            </Paper>
          </div>
        );
      }
    }

    return DragSource('panel', {
      beginDrag(props: { id: string, left: number, top: number }) {
        return {
          id: props.id,
          left: props.left,
          top: props.top,
        };
      },
    }, (connect, monitor) => ({
      connectDragSource: connect.dragSource(),
      connectDragPreview: connect.dragPreview(),
      isDragging: monitor.isDragging(),
    }))(Panel);
  };
};
