import * as React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import IconButton = require('material-ui/lib/icon-button');
import * as Colors from 'material-ui/lib/styles/colors';
import * as ReactDnd from 'react-dnd';
import objectAssign = require('object-assign');
const {
  default: ColorPicker
} = require('react-color/lib/components/SketchPicker');
import * as ColorActions from '../actions/color';
import * as ToolActions from '../actions/tool';
import * as Tools from '../constants/Tools';

import {
  PanelConstants,
  PanelStyles,
  wrapPanel
} from './Panel';

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

interface ToolsPanelProps extends React.Props<ToolsPanel> {
  actions: any;
  left: number;
  top: number;
  zIndex: number;
  connectDragPreview: ReactDnd.ConnectDragPreview;
  connectDragSource: ReactDnd.ConnectDragSource;
  isDragging: boolean;
  color: any;
  tool: any;
}

class ToolsPanel extends React.Component<ToolsPanelProps, {
  displayColorPicker: boolean;
}> {
  constructor(props) {
    super(props);
    this.state = {
      displayColorPicker: false,
    };
  }

  _handleColorPickerOpen() {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  };

  _handleColorPickerClose() {
    this.setState({ displayColorPicker: false });
  };

  _handleColorPickerChange(color) {
    this.props.actions.setColor(color.rgb);
  };

  _handleClickBrush() {
    this.props.actions.changeTool(Tools.BRUSH);
  };

  _handleClickErase() {
    this.props.actions.changeTool(Tools.ERASE);
  };

  _handleClickColorize() {
    this.props.actions.changeTool(Tools.COLORIZE);
  };

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

    const previewStyle = objectAssign({ zIndex, left, top, opacity }, PanelStyles.root);

    const self = this;
    function getIconButtonStyle(tool: any) {
      return objectAssign({
        backgroundColor: self.props.tool.type === tool ? Colors.grey200 : Colors.white,
      }, iconButtonStyles);
    }
    return connectDragPreview(<div style={previewStyle}>
      {connectDragSource(<div style={PanelStyles.handle}>Tools</div>)}
      <IconButton
        onClick={this._handleClickBrush.bind(this)}
        style={getIconButtonStyle(Tools.BRUSH)}
        tooltipStyles={tooltipStyles}
        iconClassName="material-icons" tooltipPosition="bottom-center"
        tooltip={'Brush'}>brush</IconButton>
      <IconButton
        onClick={this._handleClickErase.bind(this)}
        style={getIconButtonStyle(Tools.ERASE)}
        iconStyle={{
          transform: 'rotate(45deg)',
        }}
        tooltipStyles={tooltipStyles}
        iconClassName="material-icons" tooltipPosition="bottom-center"
        tooltip={'Erase'}>crop_portrait</IconButton>
      <IconButton
        onClick={this._handleClickColorize.bind(this)}
        style={getIconButtonStyle(Tools.COLORIZE)}
        tooltipStyles={tooltipStyles}
        iconClassName="material-icons" tooltipPosition="bottom-center"
        tooltip={'Colorize'}>colorize</IconButton>
      <div style={styles.swatch} onClick={ this._handleColorPickerOpen.bind(this) }>
        <div style={objectAssign({
          backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
        }, styles.color)}/>
      </div>
      <ColorPicker
        color={ this.props.color }
        position="right"
        display={ this.state.displayColorPicker }
        onChange={ this._handleColorPickerChange.bind(this) }
        onClose={ this._handleColorPickerClose.bind(this) }/>
    </div>);
  };
};

export default wrapPanel(connect(state => ({
  color: state.color,
  tool: state.tool,
}), dispatch => ({
  actions: bindActionCreators(objectAssign({},
    ColorActions,
    ToolActions
  ), dispatch),
}))(ToolsPanel));
