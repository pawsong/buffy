import * as React from 'react';
import { findDOMNode } from 'react-dom';
import Colors from 'material-ui/lib/styles/colors';
const Radium = require('radium');
const objectAssign = require('object-assign');
import { DragSource, DropTarget } from 'react-dnd';

const styles = {
  tab: {
    flex: 1,
    borderLeft: '1px solid',
    borderColor: Colors.grey400,
    borderRadius: 0,
    position: 'relative',
    top: 0,
    maxWidth: '22em',
    minWidth: '7em',
    height: '100%',
    padding: 0,
    margin: 0,
    backgroundClip: 'content-box',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabTitle: {
    textAlign: 'center',
    margin: 0,
    borderBottom: '1px solid transparent',
    textOverflow: 'clip',
    userSelect: 'none',
    cursor: 'default',
  },
};

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
  label: string;
  index?: number;
  active?: boolean;
  onClick?: () => any;
  style?: React.CSSProperties;
  connectDragSource?: any;
  connectDropTarget?: any;
  isDragging?: boolean;
  moveTab?: (dragIndex, hoverIndex) => any;
}

@Radium
@(DropTarget(ITEM_TYPE, tabTarget, connect => ({
  connectDropTarget: connect.dropTarget(),
})) as any)
@(DragSource(ITEM_TYPE, tabSource, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  isDragging: monitor.isDragging(),
})) as any)
class Tab extends React.Component<TabProps, {}> {
  render() {
    const { isDragging, connectDragSource, connectDropTarget } = this.props;
    const opacity = isDragging ? 0 : 1;

    const style = objectAssign({}, styles.tab, {
      color: this.props.active ? '#282929' : '#939395',
      backgroundColor: this.props.active ? Colors.white : '#e5e5e6',
    }, this.props.style, { opacity });

    return connectDragSource(connectDropTarget(
      <li
        style={style}
        onClick={this.props.onClick}
      >
        <div
          style={styles.tabTitle}
        >
          {this.props.label}
        </div>
      </li>
    ));
  }
}

export default Tab;
