import React from 'react';
import ColorPicker from 'react-color';

const styles = {
  root: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  sprite: {
    position: 'absolute',
    top: 15,
    left: 15,
  },
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
    const { color } = this.props;

    return <div style={{  }}>
      <div>
        <div style={styles.swatch} onClick={ this._handleColorPickerOpen }>
          <div style={{
            backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
            ...styles.color
          }} />
        </div>
      </div>
      <ColorPicker
        color={ this.props.color }
        position="left"
        display={ this.state.displayColorPicker }
        onChange={ this._handleColorPickerChange }
        onClose={ this._handleColorPickerClose }
        type="sketch" />
    </div>;
  },
});

export default ToolsPanel;
