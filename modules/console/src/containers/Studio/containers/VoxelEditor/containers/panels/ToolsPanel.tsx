import * as React from 'react';
import { connect } from 'react-redux';
import IconButton from 'material-ui/lib/icon-button';
import Colors from 'material-ui/lib/styles/colors';
import * as ReactDnd from 'react-dnd';
const objectAssign = require('object-assign');
const { default: ColorPicker } = require('react-color/lib/components/swatches/Swatches');
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
import rgbToHex from '../../../../../../utils/rgbToHex';
import hexToRgb from '../../../../../../utils/hexToRgb';

import ClickAwayListener from '../../../../../../components/ClickAwayListener';

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
  toolContainer: {
    width: '100%',
  },
  iconButton: {
    display: 'inline-block',
    margin: '5px 0',
  },
  tooltips: {
    top: 24,
    zIndex: 1,
  },
  colorPickerContainer: {
    position: 'absolute',
    top: 0,
    left: '100%',
    marginLeft: 10,
  },
};

const messages = defineMessages({
  title: {
    id: 'voxel-editor.panels.tools.title',
    description: 'Voxel editor tools panel title',
    defaultMessage: 'Tools',
  },
});

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

@wrapPanel({
  title: messages.title,
})
@connect((state: State) => ({
  color: state.voxelEditor.palette.color,
  toolType: state.voxelEditor.tool.type,
}), {
  changeTool,
  setColor,
})
class ToolsPanel extends React.Component<ToolsPanelProps, ToolsPanelState> {
  readyToOpenColorPicker: boolean;

  constructor(props) {
    super(props);
    this.state = {
      displayColorPicker: false,
    };
    this.readyToOpenColorPicker = false;
  }

  handleColorPickerMouseDown() {
    this.readyToOpenColorPicker = true;
  }

  handleColorPickerClickAway() {
    this.readyToOpenColorPicker = false;
  }

  handleColorPickerMouseUp() {
    if (this.readyToOpenColorPicker) {
      this.readyToOpenColorPicker = false;
      this.setState({ displayColorPicker: true });
    }
  }

  handleColorPickerClose() {
    this.readyToOpenColorPicker = false;
    this.setState({ displayColorPicker: false });
  };

  handleColorPickerChange(hex: string) {
    const rgb = hexToRgb(hex);
    this.props.setColor(rgb);
  };

  getIconButtonStyle(tool: ToolType) {
    return objectAssign({
      backgroundColor: this.props.toolType === tool ? Colors.grey200 : Colors.white,
    }, styles.iconButton);
  }

  render() {
    const { color } = this.props;
    const hex = rgbToHex(color);

    return (
      <div>
        <div style={styles.toolContainer}>
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
        </div>
        <div>
          <IconButton
            onTouchTap={() => this.props.changeTool('COLORIZE')}
            style={this.getIconButtonStyle('COLORIZE')}
            tooltipStyles={styles.tooltips}
            iconClassName="material-icons" tooltipPosition="bottom-center"
            tooltip={'Colorize'}
          >
            colorize
          </IconButton>
          <ClickAwayListener style={{ display: 'inline-block' }}
                             onClickAway={() => this.handleColorPickerClickAway()}
          >
            <div style={styles.swatch} onMouseDown={() => this.handleColorPickerMouseDown()}
                                       onMouseUp={() => this.handleColorPickerMouseUp()}
            >
              <div style={objectAssign({
                backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
              }, styles.color)}/>
            </div>
          </ClickAwayListener>
          <div style={styles.colorPickerContainer}>
            {this.state.displayColorPicker ? (
              <ClickAwayListener onClickAway={() => this.handleColorPickerClose()}>
                <ColorPicker
                  hex={hex}
                  height="100%"
                  position="right"
                  display={ this.state.displayColorPicker }
                  onChange={(value) => this.handleColorPickerChange(value) }
                />
              </ClickAwayListener>
            ) : null}
          </div>
        </div>
      </div>
    );
  };
};

export default ToolsPanel;
