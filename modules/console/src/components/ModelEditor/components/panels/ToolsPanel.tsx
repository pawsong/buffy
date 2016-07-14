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
import getUniqueToolType from '../../utils/getUniqueToolType';

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

const toolStyle = {
  margin: '5px 0',
};

const inlineStyles = {
  color: {
    width: 38,
    height: 16,
    borderRadius: 1,
  },
  tool: toolStyle,
  toolActive: Object.assign({}, toolStyle, {
    backgroundColor: Colors.grey200,
  }),
  toolInactive: Object.assign({}, toolStyle, {
    backgroundColor: Colors.white,
  }),
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
  selectedTool: ToolType;
  paletteColor: Color;
  selectTool: (tool: ToolType) => any;
  changePaletteColor: (color: Color) => any;
  onChangeColorPicker: (colorPicker: ColorPickerType) => any;
  intl?: InjectedIntlProps;
}

interface ToolsPanelState {
  displayColorPicker: boolean;
}

function getToolStyle(active: boolean) {
  return active && inlineStyles.toolActive || inlineStyles.toolInactive;
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

  handleEnableMode2D = (e: any, enabled: boolean) => {
    this.props.onEnableMode2D(enabled);
  }

  renderTools() {
    const tool = getUniqueToolType(this.props.mode2d, this.props.selectedTool, this.props.activeMap);

    return (
      <div>
        <div className={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.MOVE)}
            style={getToolStyle(tool === UniqueToolType.MOVE_2D || tool === UniqueToolType.MOVE_3D)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Move (V)'}
          >
            <CursorMoveIcon />
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.RECTANGLE_SELECT)}
            style={getToolStyle(tool === UniqueToolType.RECTANGLE_SELECT_2D || tool === UniqueToolType.RECTANGLE_SELECT_3D )}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Rectangle Select (M)'}
          >
            <SelectIcon />
          </IconButton>
        </div>
        <div className={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.BOX_SELECT)}
            style={getToolStyle(tool === UniqueToolType.BOX_SELECT)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Box Select'}
            disabled={this.props.mode2d}
          >
            <CubeOutlineIcon />
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.MAGIC_WAND)}
            style={getToolStyle(tool === UniqueToolType.MAGIC_WAND_2D || tool ===UniqueToolType.MAGIC_WAND_3D)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Magic Wand (W)'}
          >
            <AutoFixIcon />
          </IconButton>
        </div>
        <div className={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.PENCIL)}
            style={getToolStyle(tool === UniqueToolType.PENCIL_2D || tool ===UniqueToolType.PENCIL_3D)}
            tooltipStyles={inlineStyles.tooltips}
            iconClassName="material-icons"
            tooltipPosition="bottom-center"
            tooltip={'Pencil (B)'}
            disabled={this.props.activeMap !== MaterialMapType.DEFAULT && this.props.activeMap !== MaterialMapType.ALL}
          >
            mode_edit
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.ERASE)}
            style={getToolStyle(tool === UniqueToolType.ERASE_2D || tool === UniqueToolType.ERASE_3D)}
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
        <div className={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.PAINT)}
            style={getToolStyle(tool === UniqueToolType.PAINT_2D || tool === UniqueToolType.PAINT_3D)}
            iconClassName="material-icons"
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Paint'}
          >
            brush
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.COLOR_FILL)}
            style={getToolStyle(tool === UniqueToolType.COLOR_FILL_2D || tool === UniqueToolType.COLOR_FILL_3D)}
            iconStyle={{
              transform: 'scale(1.32)',
              marginTop: 4,
            }}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Color Fill (G)'}
          >
            <FormatColorFill />
          </IconButton>
        </div>
        <div className={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.LINE)}
            style={getToolStyle(tool === UniqueToolType.LINE_2D || tool === UniqueToolType.LINE_3D)}
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
            style={getToolStyle(tool === UniqueToolType.RECTANGLE_2D || tool === UniqueToolType.RECTANGLE_3D)}
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
        <div className={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.BOX)}
            style={getToolStyle(tool === UniqueToolType.BOX)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Box'}
            disabled={this.props.mode2d}
          >
            <CubeIcon />
          </IconButton>
        </div>
        <div className={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.TRANSFORM)}
            style={getToolStyle(tool === UniqueToolType.TRANSFORM)}
            iconClassName="material-icons"
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Transform'}
          >
            rotate_90_degrees_ccw
          </IconButton>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.RESIZE)}
            style={getToolStyle(tool === UniqueToolType.RESIZE)}
            tooltipStyles={inlineStyles.tooltips}
            tooltipPosition="bottom-center"
            tooltip={'Resize'}
          >
            <ArrowExpandIcon />
          </IconButton>
        </div>
        <div className={styles.iconRow}>
          <IconButton
            onTouchTap={() => this.props.selectTool(ToolType.COLORIZE)}
            style={getToolStyle(tool === UniqueToolType.COLORIZE_2D || tool === UniqueToolType.COLORIZE_3D)}
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
          style={inlineStyles.tool}
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
        <div className={styles.iconRow}>
          <Mode2dToggle
            toggled={this.props.mode2d}
            onToggle={this.handleEnableMode2D}
          />
        </div>
        <Divider />
        {this.renderTools()}
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
