import React from 'react';
import ColorPicker from 'react-color';
import {
  IconButton,
  FontIcon,
} from 'material-ui';
import {
  PanelConstants,
  PanelStyles,
  wrapPanel
} from './Panel';

import Colors from 'material-ui/lib/styles/colors';

import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as ColorActions from '../actions/color';
import * as ToolActions from '../actions/tool';
import * as Tools from '../constants/Tools';

const styles = {
  color: {
    width: '36px',
    height: '16px',
    borderRadius: '1px',
  },
  swatch: {
    marginTop: 15,
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

  _handleClickBrush() {
    this.props.actions.changeTool(Tools.BRUSH);
  },

  _handleClickErase() {
    this.props.actions.changeTool(Tools.ERASE);
  },

  _handleClickColorize() {
    this.props.actions.changeTool(Tools.COLORIZE);
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
      tool,
    } = this.props;

    const opacity = isDragging ? PanelConstants.DRAGGING_OPACITY : 1;
    const iconButtonStyles = {
      display: 'block',
      margin: '5px 0',
    };
    const tooltipStyles = {
      top: 24,
      zIndex: 1,
    };

    return connectDragPreview(<div style={{ ...PanelStyles.root, zIndex, left, top, opacity }}>
      {connectDragSource(<div style={PanelStyles.handle}>Tools</div>)}
      <IconButton
        onClick={this._handleClickBrush}
        style={{
          ...iconButtonStyles,
          backgroundColor: this.props.tool.type === Tools.BRUSH ?
            Colors.grey200 : Colors.white,
        }}
        tooltipStyles={tooltipStyles}
        iconClassName="material-icons" tooltipPosition="bottom-center"
        tooltip={'Brush'}>brush</IconButton>
      <IconButton
        onClick={this._handleClickErase}
        style={{
          ...iconButtonStyles,
          backgroundColor: this.props.tool.type === Tools.ERASE ?
            Colors.grey200 : Colors.white,
        }}
        iconStyle={{
          transform: 'rotate(45deg)',
        }}
        tooltipStyles={{...tooltipStyles }}
        iconClassName="material-icons" tooltipPosition="bottom-center"
        tooltip={'Erase'}>crop_portrait</IconButton>
      <IconButton
        onClick={this._handleClickColorize}
        style={{
          ...iconButtonStyles,
          backgroundColor: this.props.tool.type === Tools.COLORIZE ?
            Colors.grey200 : Colors.white,
        }}
        tooltipStyles={tooltipStyles}
        iconClassName="material-icons" tooltipPosition="bottom-center"
        tooltip={'Colorize'}>colorize</IconButton>
      <div style={styles.swatch} onClick={ this._handleColorPickerOpen }>
        <div style={{
          backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
          ...styles.color,
        }} />
      </div>
      <ColorPicker
        color={ this.props.color }
        position="right"
        display={ this.state.displayColorPicker }
        onChange={ this._handleColorPickerChange }
        onClose={ this._handleColorPickerClose }
        type="sketch" />
    </div>);
  },
});

export default wrapPanel(connect(state => ({
  color: state.color,
  tool: state.tool,
}), dispatch => ({
  actions: bindActionCreators({
    ...ColorActions,
    ...ToolActions,
  }, dispatch),
}))(ToolsPanel));
