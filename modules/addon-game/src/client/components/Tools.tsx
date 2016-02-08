import * as React from 'react';
import RaisedButton = require('material-ui/lib/raised-button');
import IconButton = require('material-ui/lib/icon-button');
import { connect } from 'react-redux';
const Contacts = require('material-ui/lib/svg-icons/communication/contacts');
const Terrain = require('material-ui/lib/svg-icons/maps/terrain');
const NearMe = require('material-ui/lib/svg-icons/maps/near-me');

import * as ActionTypes from '../constants/ActionTypes';

const styles = {
  wrapper: {
    position: 'absolute',
    left: '50%',
    bottom: 70,
    transform: 'translate(-50%,0)',
  },
  tool: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
};

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
      style: styles.tool,
      color: this.props.type === this.props.tool['type'] ? '#06fb93' : '#ffffff',
    });

    return  <IconButton style={styles.tool}
      onClick={() => this.props.onClick(this.props.type)}
      tooltipPosition="bottom-center"
      tooltip={this.props.label}
    >{icon}</IconButton>;
  }
}

interface ToolsProps extends React.Props<Tools> {
  tool?: Object;
  changeTool?: Function;
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
    </div>;
  }
}

export default connect(state => ({
  tool: state.tool,
}), dispatch => ({
  changeTool: (tool) => dispatch({ type: ActionTypes.CHANGE_TOOL, tool })
}))(Tools);
