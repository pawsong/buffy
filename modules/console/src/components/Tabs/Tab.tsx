import * as React from 'react';
import { findDOMNode } from 'react-dom';
import Colors from 'material-ui/lib/styles/colors';
const objectAssign = require('object-assign');
import { DragSource, DropTarget } from 'react-dnd';
import * as classNames from 'classnames';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./Tab.css');

const ITEM_TYPE = 'tab';

const tabTarget = {
    hover(props, monitor, component) {
    const dragIndex = monitor.getItem().index;
    const hoverIndex = props.index;

    // Don't replace items with themselves
    if (dragIndex === hoverIndex) {
      return;
    }

    // Determine rectangle on screen
    const hoverBoundingRect = findDOMNode(component).getBoundingClientRect();

    // Get vertical middle
    const hoverMiddleX = (hoverBoundingRect.right - hoverBoundingRect.left) / 2;

    // Determine mouse position
    const clientOffset = monitor.getClientOffset();

    // Get pixels to the top
    const hoverClientX = clientOffset.x - hoverBoundingRect.left;

    // Only perform the move when the mouse has crossed half of the items height
    // When dragging downwards, only move when the cursor is below 50%
    // When dragging upwards, only move when the cursor is above 50%

    // Dragging downwards
    if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
      return;
    }

    // Dragging upwards
    if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
      return;
    }

    // Time to actually perform the action
    props.moveTab(dragIndex, hoverIndex);

    // Note: we're mutating the monitor item here!
    // Generally it's better to avoid mutations,
    // but it's good here for the sake of performance
    // to avoid expensive index searches.
    monitor.getItem().index = hoverIndex;
  }
};

const tabSource = {
  beginDrag(props) {
    return {
      id: props.id,
      index: props.index
    };
  },
  endDrag: function (props, monitor, component) {
    if (!monitor.didDrop()) {
      return;
    }

    // When dropped on a compatible target, do something
    props.onClick();
  },
};

export interface TabProps extends React.Props<Tab> {
  value: any;
  label: string | React.ReactElement<any>;
  modified?: boolean;
  index?: number;
  active?: boolean;
  onClick?: () => any;
  onClose?: () => any;
  style?: React.CSSProperties;
  connectDragSource?: any;
  connectDropTarget?: any;
  isDragging?: boolean;
  moveTab?: (dragIndex, hoverIndex) => any;
  closable?: boolean;
}

@withStyles(styles)
@(DropTarget(ITEM_TYPE, tabTarget, connect => ({
  connectDropTarget: connect.dropTarget(),
})) as any)
@(DragSource(ITEM_TYPE, tabSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
})) as any)
class Tab extends React.Component<TabProps, {}> {
  handleClose(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    this.props.onClose();
  }

  render() {
    const { isDragging, connectDragSource, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;

    const style = objectAssign({}, {
      color: this.props.active ? '#282929' : '#939395',
      backgroundColor: this.props.active ? Colors.white : '#e5e5e6',
    }, this.props.style, { opacity });

    const closeClass = this.props.modified ? classNames(styles.tabClose, styles.tabModified) : styles.tabClose;

    return connectDragSource(connectDropTarget(
      <li
        className={styles.tab}
        style={style}
        onClick={this.props.onClick}
      >
        <div
          className={styles.tabTitle}
        >
          {this.props.label}
        </div>
        {this.props.closable ? (
          <div className={closeClass} onClick={e => this.handleClose(e)} />
        ) : null}
      </li>
    ));
  }
}

export default Tab;
