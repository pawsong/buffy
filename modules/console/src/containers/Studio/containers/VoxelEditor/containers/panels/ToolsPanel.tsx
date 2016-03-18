import * as React from 'react';
import { connect } from 'react-redux';
import IconButton from 'material-ui/lib/icon-button';
import Colors from 'material-ui/lib/styles/colors';
import * as ReactDnd from 'react-dnd';
const objectAssign = require('object-assign');
const {
  default: ColorPicker
} = require('react-color/lib/components/SketchPicker');
import { State } from '../../../../../../reducers';
import { ToolType, Color } from '../../../../../../reducers/voxelEditor';
import { changeTool, setColor } from '../../../../../../actions/voxelEditor';

import * as Tools from '../../constants/Tools';

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
  iconButton: {
    display: 'block',
    margin: '5px 0',
  },
  tooltips: {
    top: 24,
    zIndex: 1,
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
  color?: Color;
  toolType?: ToolType;
  changeTool?: (toolType: ToolType) => any;
  setColor?: (color: Color) => any;
}

interface ToolsPanelState {
  displayColorPicker: boolean;
}

@wrapPanel
@connect((state: State) => ({
  color: state.voxelEditor.palette.color,
  toolType: state.voxelEditor.tool.type,
}), {
  changeTool,
  setColor,
})
class ToolsPanel extends React.Component<ToolsPanelProps, ToolsPanelState> {
  constructor(props) {
    super(props);
    this.state = {
      displayColorPicker: false,
    };
  }

  handleColorPickerToggle() {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  };

  handleColorPickerClose() {
    this.setState({ displayColorPicker: false });
  };

  handleColorPickerChange(value: any) {
    this.props.setColor(value.rgb);
  };

  getIconButtonStyle(tool: ToolType) {
    return objectAssign({
      backgroundColor: this.props.toolType === tool ? Colors.grey200 : Colors.white,
    }, styles.iconButton);
  }

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

    const previewStyle = objectAssign({ zIndex, left, top, opacity }, PanelStyles.root);
    return connectDragPreview(
      <div style={previewStyle}>
        {connectDragSource(<div style={PanelStyles.handle}>Tools</div>)}
        <IconButton
          onTouchTap={() => this.props.changeTool('BRUSH')}
          style={this.getIconButtonStyle('BRUSH')}
          tooltipStyles={styles.tooltips}
          iconClassName="material-icons" tooltipPosition="bottom-center"
          tooltip={'Brush'}>brush</IconButton>
        <IconButton
          onTouchTap={() => this.props.changeTool('ERASE')}
          style={this.getIconButtonStyle('ERASE')}
          iconStyle={{
            transform: 'rotate(45deg)',
          }}
          tooltipStyles={styles.tooltips}
          iconClassName="material-icons" tooltipPosition="bottom-center"
          tooltip={'Erase'}>crop_portrait</IconButton>
        <IconButton
          onTouchTap={() => this.props.changeTool('COLORIZE')}
          style={this.getIconButtonStyle('COLORIZE')}
          tooltipStyles={styles.tooltips}
          iconClassName="material-icons" tooltipPosition="bottom-center"
          tooltip={'Colorize'}>colorize</IconButton>
        <div style={styles.swatch} onClick={() => this.handleColorPickerToggle()}>
          <div style={objectAssign({
            backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
          }, styles.color)}/>
        </div>
        <ColorPicker
          color={ this.props.color }
          position="right"
          display={ this.state.displayColorPicker }
          onChange={(value) => this.handleColorPickerChange(value) }
          onClose={() => this.handleColorPickerClose()}/>
      </div>
    );
  };
};

export default ToolsPanel;
