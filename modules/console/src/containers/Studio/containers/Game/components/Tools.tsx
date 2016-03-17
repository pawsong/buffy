import * as React from 'react';
import RaisedButton = require('material-ui/lib/raised-button');
import IconButton = require('material-ui/lib/icon-button');
import { connect } from 'react-redux';
const Contacts = require('material-ui/lib/svg-icons/communication/contacts');
const Terrain = require('material-ui/lib/svg-icons/maps/terrain');
const NearMe = require('material-ui/lib/svg-icons/maps/near-me');
const Palette = require('material-ui/lib/svg-icons/image/palette');
const reactColor = require('react-color');
const { default: ColorPicker }  = require('react-color/lib/components/CompactPicker');
const objectAssign = require('object-assign');

// console.log(ColorPicker);
const styles = {
  wrapper: {
    position: 'absolute',
    left: '50%',
    bottom: 30,
    transform: 'translate(-50%,0)',
  },
  tool: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
  constructor(props, context) {
    super(props, context);
    this.state = { open: false };
  }

  handleClose() {
    this.setState({ open: false });
  }

  render() {
    const color = this.props.color;

    return (
      <IconButton style={styles.tool}
        onClick={() => this.setState({ open: !this.state.open })}
        tooltipPosition="bottom-center"
        tooltip="Color picker"
      >
        <Palette color={`rgb(${color.r}, ${color.g}, ${color.b})`}/>
        <ColorPicker position="right"
                     color={color}
                     display={this.state.open}
                     onChange={color => this.props.onClick(color)}
                     onClose={() => this.handleClose()}
        />
      </IconButton>
    )
  }
}

interface ToolProps extends React.Props<Tool> {
  label: string;
  type: string;
  icon: any;
  tool: Object;
  onClick: Function;
}

class Tool extends React.Component<ToolProps, {}> {
  render() {
    const icon = React.createElement(this.props.icon, {
      color: '#ffffff',
    });

    const style = objectAssign({}, styles.tool, this.props.type === this.props.tool['type'] ? {
      backgroundColor: `rgba(${22}, ${165}, ${165}, 0.5)`,
    } : {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    });

    return <IconButton style={style}
      onClick={() => this.props.onClick(this.props.type)}
      tooltipPosition="bottom-center"
      tooltip={this.props.label}
    >{icon}</IconButton>;
  }
}

interface ToolsProps extends React.Props<Tools> {
  tool: Object;
  brush: Object;
  changeTool: Function;
  changeColor: Function;
}

class Tools extends React.Component<ToolsProps, {}> {
  handleClickTool(type) {
    this.props.changeTool(type);
  }

  render() {
    const tool = this.props.tool;

    return <div style={styles.wrapper}>
      <Tool label="Move"
            type="move"
            icon={NearMe}
            tool={tool}
            onClick={this.handleClickTool.bind(this)}
      ></Tool>
      <Tool label="Edit terrain"
            type="editTerrain"
            icon={Terrain}
            tool={tool}
            onClick={this.handleClickTool.bind(this)}
      ></Tool>
      <ColorPickerTool color={this.props.brush['color']}
                       onClick={color => this.props.changeColor(color.rgb)}/>
    </div>;
  }
}

export default Tools;
