import * as React from 'react';

import {
  DragSource,
  DropTarget,
  ConnectDragPreview,
  ConnectDragSource,
} from 'react-dnd';

import { Styles } from 'material-ui';
import FontIcon from 'material-ui/lib/font-icon';
import AppBar from 'material-ui/lib/app-bar';
import Paper from 'material-ui/lib/paper';
import Colors from 'material-ui/lib/styles/colors';

const hoistStatics = require('hoist-non-react-statics');
const update = require('react-addons-update');
const objectAssign = require('object-assign');

const styles = {
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
};

const DRAGGING_OPACITY = 0.4;

interface PanelItem {
  panelId: string;
}

interface PanelState {
  show?: boolean;
  top?: number;
  left?: number;
  order?: number;
}

/*
 * Target
 */

const panelTarget = {
  drop(props, monitor, component) {
    const { panelId } = monitor.getItem() as PanelItem;
    const state = component.state.panels[panelId];

    const delta = monitor.getDifferenceFromInitialOffset();
    const left = Math.round(state.left + delta.x);
    const top = Math.round(state.top + delta.y);
    component.movePanel(panelId, left, top);
  },
};

interface TargetState {
  panels: { [index: string]: PanelState }
}

const PANEL_TYPES = 'panel';

interface TargetProps {
  connectDropTarget: any;
}

export function connectTarget(panelIds: string[], mapIdToLocalStorageKey: (panelId: string) => string) {
  const panelIdsLength = panelIds.length;

  return function wrapWithConnect(WrappedComponent) {
    @(DropTarget(PANEL_TYPES, panelTarget, connect => ({
      connectDropTarget: connect.dropTarget()
    })) as any)
    class Connect extends React.Component<TargetProps, TargetState> {
      constructor(props) {
        super(props);

        const panels: { [index: string]: PanelState } = {};

        let index = 0;
        panelIds.forEach(panelId => {
          let panel = {} as PanelState;
          const savedPanel = localStorage.getItem(mapIdToLocalStorageKey(panelId));
          if (savedPanel) {
            try {
              panel = JSON.parse(savedPanel);
            } catch(err) {}
          }

          panels[panelId] = {
            show: panel.show !== false,
            top: panel.top || 0,
            left: panel.left || 0,
            order: ++index,
          };
        });

        this.state = { panels };
      }

      static childContextTypes = {
        movePanelToTop: React.PropTypes.func.isRequired,
        panelStates: React.PropTypes.object.isRequired,
      } as any

      getChildContext() {
        return {
          movePanelToTop: this.moveToTop,
          panelStates: this.state.panels,
        };
      }

      movePanel(panelId: string, left, top) {
        this.moveToTop(panelId, { left, top }, () => {
          localStorage.setItem(mapIdToLocalStorageKey(panelId), JSON.stringify(this.state.panels[panelId]));
        });
      }

      moveToTop = (panelId: string, state: PanelState = {}, callback?: any) => {
        const { order } = this.state.panels[panelId];

        const query = {};

        panelIds.forEach(panelId => {
          const panelState = this.state.panels[panelId];
          if (panelState.order > order) query[panelId] = { $merge: { order: panelState.order - 1 } };
        });

        query[panelId] = {
          $merge: objectAssign({ order: panelIdsLength }, state),
        };

        this.setState(update(this.state, { panels: query }), callback);
      }

      render() {
        const element = React.createElement(WrappedComponent, this.props);
        return this.props.connectDropTarget(<div>{element}</div>);
      }
    }

    return hoistStatics(Connect, WrappedComponent);
  };
}

/*
 * Source
 */
interface PanelProps extends React.Props<Panel> {
  panelId: string;
  title: string;

  connectDragPreview?: ConnectDragPreview;
  connectDragSource?: ConnectDragSource;
  isDragging?: boolean;
}

const panelSource = {
  beginDrag(props): PanelItem {
    return { panelId: props.panelId };
  },
};

@(DragSource(PANEL_TYPES, panelSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging(),
})) as any)
class Panel extends React.Component<PanelProps, {}> {
  static contextTypes = {
    muiTheme: React.PropTypes.object.isRequired,
    panelStates: React.PropTypes.object.isRequired,
    movePanelToTop: React.PropTypes.func.isRequired,
  } as any;

  static childContextTypes = {
    muiTheme: React.PropTypes.object,
  } as any

  static createState: () => PanelState;

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

  moveToTop = () => this.context['movePanelToTop'](this.props.panelId);

  render() {
    const { left, top, order } = this.context['panelStates'][this.props.panelId];
    const { connectDragPreview, connectDragSource, isDragging } = this.props;

    const opacity = isDragging ? DRAGGING_OPACITY : 1;
    const previewStyle = objectAssign({ zIndex: order, left, top, opacity }, styles.root);

    return connectDragPreview(
      <div style={previewStyle} onClick={this.moveToTop}>
        <Paper style={styles.paper}>
          {connectDragSource(
            <div>
              <AppBar
                style={styles.handle}
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