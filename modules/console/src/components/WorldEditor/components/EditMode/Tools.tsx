import * as React from 'react';
import RaisedButton from 'material-ui/lib/raised-button';
import IconButton from 'material-ui/lib/icon-button';
const Terrain = require('material-ui/lib/svg-icons/maps/terrain');
const NearMe = require('material-ui/lib/svg-icons/maps/near-me');
const Palette = require('material-ui/lib/svg-icons/image/palette');
const { default: ColorPicker }  = require('react-color/lib/components/compact/Compact');
const objectAssign = require('object-assign');
import ClickAwayListener from '../../../ClickAwayListener';

import { ToolType, Color } from '../../types';

const styles = {
  wrapper: {
    position: 'absolute',
    left: 30,
    bottom: 30,
  },
  tool: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  colorContainer: {
    display: 'inline-block',
  },
  colorPicker: {
    position: 'absolute',
    bottom: 0,
    left: '100%',
    marginLeft: 10,
  },
};

interface ColorPickerToolProps extends React.Props<ColorPickerTool> {
  color: any;
  onClick: Function;
}

interface ColorPickerToolStates {
  open?: boolean;
}

class ColorPickerTool extends React.Component<ColorPickerToolProps, ColorPickerToolStates> {
  readyToOpen: boolean;
  constructor(props, context) {
    super(props, context);
    this.state = { open: false };
    this.readyToOpen = false;
  }

  handleTouchStart() {
    this.readyToOpen = true;
  }

  handleTouchEnd() {
    if (this.readyToOpen) {
      this.readyToOpen = false;
      if (!this.state.open) this.setState({ open: true });
    }
  }

  handleColorPickerClickAway() {
    this.readyToOpen = false;
    if (this.state.open) this.setState({ open: false });
  }

  render() {
    const color = this.props.color;

    return (
      <div style={styles.colorContainer}>
        <IconButton
          style={styles.tool}
          onMouseDown={() => this.handleTouchStart()}
          onMouseUp={() => this.handleTouchEnd()}
          tooltipPosition="bottom-center"
          tooltip="Color picker"
        >
          <Palette color={`rgb(${color.r}, ${color.g}, ${color.b})`}/>
        </IconButton>
        { this.state.open ? (
          <ClickAwayListener style={styles.colorPicker} onClickAway={() => this.handleColorPickerClickAway()}>
            <ColorPicker
              position="right"
              color={color}
              display={this.state.open}
              onChange={color => this.props.onClick(color)}
            />
          </ClickAwayListener>
        ) : null}
      </div>
    )
  }
}

interface ToolProps extends React.Props<Tool> {
  label: string;
  type: ToolType;
  icon: any;
  selectedTool: ToolType;
  changeTool: (tool: ToolType) => any;
}

class Tool extends React.Component<ToolProps, {}> {
  render() {
    const icon = React.createElement(this.props.icon, {
      color: '#ffffff',
    });

    const style = objectAssign({}, styles.tool, this.props.type === this.props.selectedTool ? {
      backgroundColor: `rgba(${22}, ${165}, ${165}, 0.5)`,
    } : {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    });

    return (
        <IconButton
          style={style}
          onTouchTap={() => this.props.changeTool(this.props.type)}
          tooltipPosition="bottom-center"
          tooltip={this.props.label}
        >{icon}</IconButton>
    );
  }
}

interface ToolsProps extends React.Props<Tools> {
  selectedTool: ToolType;
  brushColor: Color;
  changeTool: (tool: ToolType) => any;
  changeBrushColor: (color: Color) => any;
}

class Tools extends React.Component<ToolsProps, {}> {
  render() {
    const { selectedTool } = this.props;

    return (
      <div style={styles.wrapper}>
        <Tool
          label="Move"
          icon={NearMe}
          type={ToolType.move}
          selectedTool={selectedTool}
          changeTool={this.props.changeTool}
        />
        <Tool
          label="Edit terrain"
          icon={Terrain}
          type={ToolType.editTerrain}
          selectedTool={selectedTool}
          changeTool={this.props.changeTool}
        />
        <ColorPickerTool
          color={this.props.brushColor}
          onClick={color => this.props.changeBrushColor(color.rgb)}
        />
      </div>
    );
  }
}

export default Tools;
