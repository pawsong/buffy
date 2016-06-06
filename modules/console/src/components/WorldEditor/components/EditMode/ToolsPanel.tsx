import * as React from 'react';
const pure = require('recompose/pure').default;

import IconButton from 'material-ui/IconButton';
import * as Colors from 'material-ui/styles/colors';
import * as ReactDnd from 'react-dnd';
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

import {
  EditToolType,
  Color,
} from '../../types';

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
    id: 'worldeditor.panels.tools.title',
    description: 'WorldEditor tools panel title',
    defaultMessage: 'Tools',
  },
});

interface ToolsPanelProps extends React.Props<ToolsPanel> {
  selectedTool: EditToolType;
  paletteColor: Color;
  selectTool: (tool: EditToolType) => any;
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

  getIconButtonStyle(style: React.CSSProperties, tool: EditToolType) {
    return Object.assign({
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
            onTouchTap={() => this.props.selectTool(EditToolType.MOVE)}
            style={this.getIconButtonStyle(styles.iconButton, EditToolType.MOVE)}
            tooltipStyles={styles.tooltips}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Move'}
          >
            near_me
          </IconButton>
        </div>
        <div style={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(EditToolType.ADD_BLOCK)}
            style={this.getIconButtonStyle(styles.iconButton, EditToolType.ADD_BLOCK)}
            tooltipStyles={styles.tooltips}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Brush'}
          >
            brush
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(EditToolType.REMOVE_BLOCK)}
            style={this.getIconButtonStyle(styles.iconButtonRight, EditToolType.REMOVE_BLOCK)}
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
            onTouchTap={() => this.props.selectTool(EditToolType.COLORIZE)}
            style={this.getIconButtonStyle(styles.iconButton, EditToolType.COLORIZE)}
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
              <div style={Object.assign({
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
