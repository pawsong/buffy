import React from 'react';
import { DragSource } from 'react-dnd';

const style = {
  position: 'absolute',
  border: '1px dashed gray',
  backgroundColor: 'white',
  padding: '0.5rem 1rem',
};

const handleStyle = {
  backgroundColor: 'green',
  width: '100%',
  height: '1rem',
  display: 'block',
  marginRight: '0.75rem',
  cursor: 'move',
};


const Panel = React.createClass({
  render() {
    const {
      left,
      top,
      order,
      title,
      connectDragPreview,
      connectDragSource,
      isDragging,
      children,
    } = this.props;

    if (isDragging) { return null; }
    const opacity = isDragging ? 0.4 : 1;

    return connectDragPreview(
      <div style={{ ...style, zIndex: order, left, top, opacity }}>
        {connectDragSource(
          <div style={handleStyle}>
            {title}
          </div>
        )}
        {children}
      </div>);
  },
});

export default DragSource('panel', {
  beginDrag(props) {
    const { id, left, top } = props;
    return { id, left, top };
  },
}, (connect, monitor) => ({
  connectDragSource: connect.dragSource(),
  connectDragPreview: connect.dragPreview(),
  isDragging: monitor.isDragging()
}))(Panel);
