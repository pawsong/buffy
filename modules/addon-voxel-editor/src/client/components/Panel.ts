import * as React from 'react';
import { DragSource } from 'react-dnd';

export const PanelConstants = {
  DRAGGING_OPACITY: 0.4,
}

export const PanelStyles = {
  root: {
    position: 'absolute',
    border: '1px dashed gray',
    backgroundColor: 'white',
    padding: '0.5rem 1rem',
  },
  handle: {
    backgroundColor: 'green',
    width: '100%',
    height: 20,
    display: 'block',
    marginRight: '0.75rem',
    cursor: 'move',
  },
}

export function wrapPanel(Component) {
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
    isDragging: monitor.isDragging()
  }))(Component);
};
