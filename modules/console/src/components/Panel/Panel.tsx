import * as React from 'react';
import { findDOMNode } from 'react-dom';

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

import { FormattedMessage } from 'react-intl';

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

interface TargetState {
  panels: { [index: string]: PanelState }
}

interface TargetProps {
  connectDropTarget: any;
}

interface ConnectTargetOptions {
  panelTypes: string;
  panelIds: string[];
  mapIdToLocalStorageKey: (panelId: string) => string;
  limitTop?: number; // px unit
}

export function connectTarget(options: ConnectTargetOptions) {
  const {
    panelTypes,
    panelIds,
    mapIdToLocalStorageKey,
  } = options;

  const limitTop = options.limitTop || 0;

  const panelTarget = {
    drop(props, monitor, component) {
      const { panelId } = monitor.getItem() as PanelItem;
      const state = component.state.panels[panelId];

      const width = component.element.clientWidth;
      const height = component.element.clientHeight;

      const delta = monitor.getDifferenceFromInitialOffset();
      const left = state.left + delta.x / width;
      const top = state.top + delta.y / height;

      if (limitTop > top * height) return;

      component.movePanel(panelId, left, top);
    },
  };

  const panelIdsLength = panelIds.length;

  return function wrapWithConnect(WrappedComponent) {
    @(DropTarget(panelTypes, panelTarget, connect => ({
      connectDropTarget: connect.dropTarget()
    })) as any)
    class Connect extends React.Component<TargetProps, TargetState> {
      element: HTMLElement;

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

      componentDidMount() {
        const rootElement = findDOMNode<HTMLElement>(this.refs['root']);
        this.element = (rootElement.firstElementChild || rootElement.firstChild) as HTMLElement;
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
        return this.props.connectDropTarget(<div><div ref="root">{element}</div></div>);
      }
    }

    return hoistStatics(Connect, WrappedComponent);
  };
}

/*
 * Source
 */
interface PanelProps extends React.Props<any> {
  connectDragPreview: ConnectDragPreview;
  connectDragSource: ConnectDragSource;
  isDragging: boolean;
}

interface ConnectSourceOptions {
  panelTypes: string;
  panelId: string;
  title: FormattedMessage.MessageDescriptor;
}

export function connectSource({
  panelTypes,
  panelId,
  title,
}: ConnectSourceOptions) {
  const panelSource = {
    beginDrag(props): PanelItem {
      return { panelId };
    },
  };

  return function wrapWithConnect(WrappedComponent) {
    @(DragSource(panelTypes, panelSource, (connect, monitor) => ({
      connectDragSource: connect.dragSource(),
      connectDragPreview: connect.dragPreview(),
      isDragging: monitor.isDragging(),
    })) as any)
    class ConnectPanelSource extends React.Component<PanelProps, {}> {
      static contextTypes = {
        muiTheme: React.PropTypes.object.isRequired,
        panelStates: React.PropTypes.object.isRequired,
        movePanelToTop: React.PropTypes.func.isRequired,
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

      moveToTop = () => this.context['movePanelToTop'](panelId);

      render() {
        const { left, top, order } = this.context['panelStates'][panelId];
        const { connectDragPreview, connectDragSource, isDragging } = this.props;

        const opacity = isDragging ? DRAGGING_OPACITY : 1;
        const previewStyle = objectAssign({
          zIndex: order,
          left: `${left * 100}%`,
          top: `${top * 100}%`,
          opacity,
        }, styles.root);

        const element = React.createElement(WrappedComponent, this.props);

        return connectDragPreview(
          <div style={previewStyle} onClick={this.moveToTop}>
            <Paper style={styles.paper}>
              {connectDragSource(
                <div>
                  <AppBar
                    style={styles.handle}
                    title={<FormattedMessage {...title}/>}
                    titleStyle={styles.handleLabel}
                    iconElementLeft={
                      <FontIcon className="material-icons" style={styles.handleIcon} color={Colors.white}>menu</FontIcon>
                    }
                  />
                </div>
              )}
              {element}
            </Paper>
          </div>
        );
      }
    }

    return hoistStatics(ConnectPanelSource, WrappedComponent);
  }
}
