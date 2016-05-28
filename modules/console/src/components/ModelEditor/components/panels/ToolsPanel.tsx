import * as React from 'react';
const pure = require('recompose/pure').default;

import IconButton from 'material-ui/lib/icon-button';
import Colors from 'material-ui/lib/styles/colors';
import * as ReactDnd from 'react-dnd';
const objectAssign = require('object-assign');
const { default: ColorPicker } = require('react-color/lib/components/swatches/Swatches');
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';
import rgbToHex from '../../../../utils/rgbToHex';
import hexToRgb from '../../../../utils/hexToRgb';

import { connectSource } from '../../../Panel';

import {
  PanelTypes,
  Panels,
} from '../../panel';

import ClickAwayListener from '../../../ClickAwayListener';

import { ToolType, Color } from '../../types';

import CubeIcon from '../../../CubeIcon';
import CubeOutlineIcon from '../../../CubeOutlineIcon';
import AutoFixIcon from '../../../AutoFixIcon';
import CursorMoveIcon from '../../../CursorMoveIcon';

const styles = {
  color: {
    width: 38,
    height: 16,
    borderRadius: 1,
  },
  swatch: {
    marginTop: 15,
    padding: 5,
    background: '#fff',
    borderRadius: 1,
    boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
    display: 'inline-block',
    cursor: 'pointer',
  },
  iconRow: {
    width: 110,
    margin: '0 auto',
  },
  iconButton: {
    display: 'inline-block',
    margin: '5px 0',
  },
  iconButtonRight: {
    display: 'inline-block',
    margin: '5px 0',
    float: 'right',
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
    zIndex: 999,
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
  selectedTool: ToolType;
  paletteColor: Color;
  selectTool: (tool: ToolType) => any;
  changePaletteColor: (color: Color) => any;

  intl?: InjectedIntlProps;
}

interface ToolsPanelState {
  displayColorPicker: boolean;
}

@connectSource({
  panelTypes: PanelTypes,
  panelId: Panels.tools,
  title: messages.title,
})
@injectIntl
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

  getIconButtonStyle(style: React.CSSProperties, tool: ToolType) {
    return objectAssign({
      backgroundColor: this.props.selectedTool === tool ? Colors.grey200 : Colors.white,
    }, style);
  }

  render() {
    const { paletteColor } = this.props;
    const hex = rgbToHex(paletteColor);

    return (
      <div>
        <div style={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.MOVE)}
            style={this.getIconButtonStyle(styles.iconButton, ToolType.MOVE)}
            tooltipStyles={styles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Move'}
          >
            <CursorMoveIcon />
          </IconButton>
        </div>
        <div style={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.brush)}
            style={this.getIconButtonStyle(styles.iconButton, ToolType.brush)}
            tooltipStyles={styles.tooltips}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Brush'}
          >
            brush
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.erase)}
            style={this.getIconButtonStyle(styles.iconButtonRight, ToolType.erase)}
            iconStyle={{
              transform: 'rotate(45deg)',
            }}
            tooltipStyles={styles.tooltips}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Erase'}
          >
            crop_portrait
          </IconButton>
        </div>
        <div style={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.rectangle)}
            style={this.getIconButtonStyle(styles.iconButton, ToolType.rectangle)}
            tooltipStyles={styles.tooltips}
            iconStyle={{
              transform: 'scale(1.32)',
            }}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Rectangle'}
          >
            stop
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.box)}
            style={this.getIconButtonStyle(styles.iconButtonRight, ToolType.box)}
            tooltipStyles={styles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Box'}
          >
            <CubeIcon />
          </IconButton>
        </div>
        <div style={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.BOX_SELECT)}
            style={this.getIconButtonStyle(styles.iconButton, ToolType.BOX_SELECT)}
            tooltipStyles={styles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Box Select'}
          >
            <CubeOutlineIcon />
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.MAGIC_WAND)}
            style={this.getIconButtonStyle(styles.iconButtonRight, ToolType.MAGIC_WAND)}
            tooltipStyles={styles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Magic Wand'}
          >
            <AutoFixIcon />
          </IconButton>
        </div>
        <div style={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.colorize)}
            style={this.getIconButtonStyle(styles.iconButton, ToolType.colorize)}
            tooltipStyles={styles.tooltips}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Colorize'}
          >
            colorize
          </IconButton>
          <ClickAwayListener style={styles.iconButtonRight}
                              onClickAway={() => this.handleColorPickerClickAway()}
          >
            <div style={styles.swatch} onMouseDown={() => this.handleColorPickerMouseDown()}
                                        onMouseUp={() => this.handleColorPickerMouseUp()}
            >
              <div style={objectAssign({
                backgroundColor: `rgb(${paletteColor.r}, ${paletteColor.g}, ${paletteColor.b})`,
              }, styles.color)}/>
            </div>
          </ClickAwayListener>
          <div style={styles.colorPickerContainer}>
            {this.state.displayColorPicker ? (
              <ClickAwayListener onClickAway={() => this.handleColorPickerClose()}>
                <ColorPicker hex={hex}
                              height="100%"
                              position="right"
                              display={this.state.displayColorPicker}
                              onChange={value => this.props.changePaletteColor(value.rgb) }
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