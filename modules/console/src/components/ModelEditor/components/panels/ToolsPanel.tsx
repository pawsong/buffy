import * as React from 'react';
const pure = require('recompose/pure').default;

import RaisedButton from 'material-ui/RaisedButton';
import IconButton from 'material-ui/IconButton';
import Divider from 'material-ui/Divider';
import * as Colors from 'material-ui/styles/colors';
import Toggle from 'material-ui/Toggle';
import * as ReactDnd from 'react-dnd';
const { default: Swatches } = require('react-color/lib/components/swatches/Swatches');
const { default: Sketch } = require('react-color/lib/components/sketched/Sketch');
import { defineMessages, injectIntl, InjectedIntlProps, FormattedMessage } from 'react-intl';

const Tooltip = require('material-ui/internal/Tooltip').default;

import rgbToHex from '../../../../utils/rgbToHex';
import hexToRgb from '../../../../utils/hexToRgb';

import { connectSource } from '../../../Panel';

import mapinfo from '../../mapinfo';

import {
  PanelTypes,
  Panels,
} from '../../panel';

import ClickAwayListener from '../../../ClickAwayListener';

import {
  ToolType,
  Color,
  UniqueToolType,
  ColorPickerType,
} from '../../types';

import {
  ModelFileType,
  MaterialMapType,
} from '../../../../types';

import CubeIcon from '../../../CubeIcon';
import CubeOutlineIcon from '../../../CubeOutlineIcon';
import AutoFixIcon from '../../../AutoFixIcon';
import CursorMoveIcon from '../../../CursorMoveIcon';
import SelectIcon from '../../../SelectIcon';
import ArrowExpandIcon from '../../../icons/ArrowExpandIcon';
import FormatColorFill from '../../../icons/FormatColorFill';

import withStyles from 'isomorphic-style-loader/lib/withStyles';
const styles = require('./ToolsPanel.css');

const inlineStyles = {
  color: {
    width: 38,
    height: 16,
    borderRadius: 1,
  },
  iconRow: {
    width: 110,
    margin: '0 auto',
  },
  iconButton: {
    margin: '5px 0',
  },
  iconButtonRight: {
    margin: '5px 0',
    float: 'right',
  },
  tooltips: {
    top: 24,
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
  fileType: ModelFileType;
  colorPicker: ColorPickerType;
  activeMap: MaterialMapType;
  mode2d: boolean;
  onEnableMode2D: (enabled: boolean) => any;
  selectedTool: UniqueToolType;
  paletteColor: Color;
  selectTool: (tool: ToolType) => any;
  changePaletteColor: (color: Color) => any;
  onChangeColorPicker: (colorPicker: ColorPickerType) => any;
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
@withStyles(styles)
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

  getIconButtonStyle(style: React.CSSProperties, tool: UniqueToolType) {
    return Object.assign({
      backgroundColor: this.props.selectedTool === tool ? Colors.grey200 : Colors.white,
    }, style);
  }

  handleEnableMode2D = (e: any, enabled: boolean) => {
    this.props.onEnableMode2D(enabled);
  }

  render2dTools() {
    return (
      <div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.MOVE)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.MOVE_2D)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Move (V)'}
          >
            <CursorMoveIcon />
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.RECTANGLE_SELECT)}
            style={this.getIconButtonStyle(inlineStyles.iconButtonRight, UniqueToolType.RECTANGLE_SELECT_2D)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Rectangle select (M)'}
          >
            <SelectIcon />
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.MAGIC_WAND)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.MAGIC_WAND_2D)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Magic Wand (W)'}
          >
            <AutoFixIcon />
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.PENCIL)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.PENCIL_2D)}
            tooltipStyles={inlineStyles.tooltips}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Pencil (B)'}
          >
            mode_edit
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.ERASE)}
            style={this.getIconButtonStyle(inlineStyles.iconButtonRight, UniqueToolType.ERASE_2D)}
            iconStyle={{
              transform: 'rotate(45deg)',
            }}
            tooltipStyles={inlineStyles.tooltips}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Erase (E)'}
          >
            crop_portrait
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.PAINT)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.PAINT_2D)}
            iconClassName="material-icons"
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Paint'}
          >
            brush
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.COLOR_FILL)}
            style={this.getIconButtonStyle(inlineStyles.iconButtonRight, UniqueToolType.COLOR_FILL_2D)}
            iconStyle={{
              transform: 'scale(1.32)',
              marginTop: 4,
            }}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Color fill (G)'}
          >
            <FormatColorFill />
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.LINE)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.LINE_2D)}
            iconStyle={{
              transform: 'rotate(-45deg) scale(1.50)',
            }}
            iconClassName="material-icons"
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Line'}
          >
            remove
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.RECTANGLE)}
            style={this.getIconButtonStyle(inlineStyles.iconButtonRight, UniqueToolType.RECTANGLE_2D)}
            tooltipStyles={inlineStyles.tooltips}
            iconStyle={{
              transform: 'scale(1.32)',
            }}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Rectangle (R)'}
          >
            stop
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.TRANSFORM)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.TRANSFORM)}
            iconClassName="material-icons"
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Transform'}
          >
            rotate_90_degrees_ccw
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.RESIZE)}
            style={this.getIconButtonStyle(inlineStyles.iconButtonRight, UniqueToolType.RESIZE)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Resize'}
          >
            <ArrowExpandIcon />
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.COLORIZE)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.COLORIZE_2D)}
            tooltipStyles={inlineStyles.tooltips}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Colorize (I)'}
          >
            colorize
          </IconButton>
          {this.renderColorPicker()}
        </div>
      </div>
    );
  }

  render3dTools() {
    return (
      <div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.MOVE)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.MOVE_3D)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Move (V)'}
          >
            <CursorMoveIcon />
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.RECTANGLE_SELECT)}
            style={this.getIconButtonStyle(inlineStyles.iconButtonRight, UniqueToolType.RECTANGLE_SELECT_3D)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Rectangle select (M)'}
          >
            <SelectIcon />
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.BOX_SELECT)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.BOX_SELECT)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Box Select'}
          >
            <CubeOutlineIcon />
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.MAGIC_WAND)}
            style={this.getIconButtonStyle(inlineStyles.iconButtonRight, UniqueToolType.MAGIC_WAND_3D)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Magic Wand (W)'}
          >
            <AutoFixIcon />
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.PENCIL)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.PENCIL_3D)}
            tooltipStyles={inlineStyles.tooltips}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Pencil (B)'}
          >
            mode_edit
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.ERASE)}
            style={this.getIconButtonStyle(inlineStyles.iconButtonRight, UniqueToolType.ERASE_3D)}
            iconStyle={{
              transform: 'rotate(45deg)',
            }}
            tooltipStyles={inlineStyles.tooltips}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Erase (E)'}
          >
            crop_portrait
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.PAINT)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.PAINT_3D)}
            iconClassName="material-icons"
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Paint'}
          >
            brush
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.COLOR_FILL)}
            style={this.getIconButtonStyle(inlineStyles.iconButtonRight, UniqueToolType.COLOR_FILL_3D)}
            iconStyle={{
              transform: 'scale(1.32)',
              marginTop: 4,
            }}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Color fill (G)'}
          >
            <FormatColorFill />
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.LINE)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.LINE_3D)}
            iconStyle={{
              transform: 'rotate(-45deg) scale(1.50)',
            }}
            iconClassName="material-icons"
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Line'}
          >
            remove
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.RECTANGLE)}
            style={this.getIconButtonStyle(inlineStyles.iconButtonRight, UniqueToolType.RECTANGLE_3D)}
            tooltipStyles={inlineStyles.tooltips}
            iconStyle={{
              transform: 'scale(1.32)',
            }}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Rectangle (R)'}
          >
            stop
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.BOX)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.BOX)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Box'}
          >
            <CubeIcon />
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.TRANSFORM)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.TRANSFORM)}
            iconClassName="material-icons"
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Transform'}
          >
            rotate_90_degrees_ccw
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.RESIZE)}
            style={this.getIconButtonStyle(inlineStyles.iconButtonRight, UniqueToolType.RESIZE)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Resize'}
          >
            <ArrowExpandIcon />
          </IconButton>
        </div>
        <div style={inlineStyles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.COLORIZE)}
            style={this.getIconButtonStyle(inlineStyles.iconButton, UniqueToolType.COLORIZE_3D)}
            tooltipStyles={inlineStyles.tooltips}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Colorize (I)'}
          >
            colorize
          </IconButton>
          {this.renderColorPicker()}
        </div>
      </div>
    );
  }

  handleAttachmentPointColorClick = () => this.props.changePaletteColor({ r: 0xff, g: 0, b: 0xff });

  renderColorPicker() {
    const { paletteColor } = this.props;

    return (
      <div style={{ display: 'inline' }}>
        <ClickAwayListener
          style={inlineStyles.iconButtonRight}
          onClickAway={() => this.handleColorPickerClickAway()}
        >
          <div
            className={styles.swatch}
            onMouseDown={() => this.handleColorPickerMouseDown()}
            onMouseUp={() => this.handleColorPickerMouseUp()}
          >
            <div style={Object.assign({
              backgroundColor: `rgb(${paletteColor.r}, ${paletteColor.g}, ${paletteColor.b})`,
            }, inlineStyles.color)} />
          </div>
        </ClickAwayListener>
        <div className={styles.colorPickerContainer}>
          {this.state.displayColorPicker ? (
            <ClickAwayListener
              className={this.props.activeMap === MaterialMapType.TROVE_TYPE ? styles.colorPickerTypeMap : ''}
              onClickAway={() => this.handleColorPickerClose()}
            >
              {this.renderColorPickerBody()}
              {this.renderColorPickerButtons()}
            </ClickAwayListener>
          ) : null}
        </div>
      </div>
    );
  }

  handleColorPickerChange = (value: any) => this.props.changePaletteColor(value.rgb)

  renderColorPickerBody() {
    const { paletteColor } = this.props;

    if (   (this.props.activeMap === MaterialMapType.DEFAULT || this.props.activeMap === MaterialMapType.ALL)
        && this.props.colorPicker === ColorPickerType.ADVANCED
    ) {
      return (
        <Sketch
          color={paletteColor}
          disableAlpha={true}
          display={this.state.displayColorPicker}
          onChange={this.handleColorPickerChange}
        />
      );
    } else {
      const info = mapinfo[this.props.activeMap];
      const colors = info && [info.hexColors];
      const colorWidth = colors ? 72 : undefined;

      return (
        <Swatches
          colors={colors}
          width={colorWidth}
          height="100%"
          position="right"
          display={this.state.displayColorPicker}
          onChange={this.handleColorPickerChange}
        />
      );
    }
  }

  renderColorPickerButtons() {
    if (this.props.activeMap !== MaterialMapType.DEFAULT && this.props.activeMap !== MaterialMapType.ALL) return null;

    return (
      <div className={styles.colorPickerButtons}>
        <RaisedButton
          className={styles.colorPickerButton}
          label={'Simple'}
          onTouchTap={() => this.props.onChangeColorPicker(ColorPickerType.SIMPLE)}
        />
        <RaisedButton
          className={styles.colorPickerButton}
          label={'Advanced'}
          onTouchTap={() => this.props.onChangeColorPicker(ColorPickerType.ADVANCED)}
        />
        {this.props.fileType === ModelFileType.TROVE ? <RaisedButton
          className={styles.colorPickerButton}
          label={'Attachment'}
          labelPosition="before"
          icon={<CubeIcon color={'#ff00ff'} />}
          onTouchTap={this.handleAttachmentPointColorClick}
        /> : null}
      </div>
    );
  }

  render() {
    return (
      <div>
        <div style={inlineStyles.iconRow}>
          <Mode2dToggle
            toggled={this.props.mode2d}
            onToggle={this.handleEnableMode2D}
          />
        </div>
        <Divider />
        {this.props.mode2d ? this.render2dTools() : this.render3dTools()}
      </div>
    );
  };
};

interface Mode2dToggleProps {
  toggled: boolean;
  onToggle: (event: any, value: boolean) => any;
}

interface Mode2dToggleState {
  tooltipShown: boolean;
}

class Mode2dToggle extends React.Component<Mode2dToggleProps, Mode2dToggleState> {
  constructor(props) {
    super(props);
    this.state = { tooltipShown: false };
  }

  showTooltip() {
    this.setState({ tooltipShown: true });
  }

  hideTooltip() {
    this.setState({ tooltipShown: false });
  }

  handleBlur = (event) => this.hideTooltip();

  handleFocus = (event) => this.showTooltip();

  handleMouseLeave = (event) => this.hideTooltip();

  handleMouseOut = (event) => this.hideTooltip();

  handleMouseEnter = (event) => this.showTooltip();

  render() {
    return (
      <div style={{
        position: 'relative',
      }}>
        <Toggle
          label="2D"
          toggled={this.props.toggled}
          onToggle={this.props.onToggle}
          onMouseEnter={this.handleMouseEnter}
          onMouseLeave={this.handleMouseLeave}
          onMouseOut={this.handleMouseOut}
          onBlur={this.handleBlur}
          onFocus={this.handleFocus}
          style={{
            marginTop: 12,
            marginBottom: 8,
          }}
          labelStyle={{
            marginLeft: 14,
            width: 44,
          }}
        />
        <div style={{
          width: 48,
          margin: 'auto',
          position: 'relative',
          top: -50,
        }}>
          <Tooltip
            ref="tooltip"
            label={'Toggle 2D Mode (D)'}
            show={this.state.tooltipShown}
            style={Object.assign({
              boxSizing: 'border-box',
            })}
            verticalPosition={'bottom'}
            horizontalPosition={'center'}
          />
        </div>
      </div>
    );
  }
}

export default ToolsPanel;
