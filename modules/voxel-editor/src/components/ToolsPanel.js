import React from 'react';
import ColorPicker from 'react-color';
import {
  PanelConstants,
  PanelStyles,
  wrapPanel
} from './Panel';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as ColorActions from '../actions/color';

const styles = {
  color: {
    width: '36px',
    height: '14px',
    borderRadius: '2px',
  },
  swatch: {
    padding: '5px',
    background: '#fff',
    borderRadius: '1px',
    boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
    display: 'inline-block',
    cursor: 'pointer',
  },
};

const ToolsPanel = React.createClass({
  _handleColorPickerOpen() {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  },

  _handleColorPickerClose() {
    this.setState({ displayColorPicker: false });
  },

  _handleColorPickerChange(color) {
    this.props.actions.setColor(color.rgb);
  },

  getInitialState() {
    return {
      displayColorPicker: false
    };
  },

  render() {
    const {
      left,
      top,
      zIndex,
      connectDragPreview,
      connectDragSource,
      isDragging,
      color,
    } = this.props;

    const opacity = isDragging ? PanelConstants.DRAGGING_OPACITY : 1;

    return connectDragPreview(<div style={{ ...PanelStyles.root, zIndex, left, top, opacity }}>
      {connectDragSource(<div style={PanelStyles.handle}>Tools</div>)}
      <div style={styles.swatch} onClick={ this._handleColorPickerOpen }>
        <div style={{
          backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
          ...styles.color
        }} />
      </div>
      <ColorPicker
        color={ this.props.color }
        position="left"
        display={ this.state.displayColorPicker }
        onChange={ this._handleColorPickerChange }
        onClose={ this._handleColorPickerClose }
        type="sketch" />
    </div>);
  },
});

export default wrapPanel(connect(state => ({
  color: state.color,
}), dispatch => ({
  actions: bindActionCreators({
    ...ColorActions
  }, dispatch),
}))(ToolsPanel));
