import React from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import ColorPicker from 'react-color';
import {
  RaisedButton,
} from 'material-ui';

import * as ColorActions from '../actions/color';
import * as SpriteActions from '../actions/sprite';

import getPixels from 'get-pixels';
import Promise from 'bluebird';

import SpriteCameras from '../SpriteCameras';

import shapeCarve from '../shapeCarve';
import greedyMesh from '../greedyMesh';

import MenuBar from './menubar/MenuBar';

const GRID_SIZE = 16;
const UNIT_PIXEL = 25;
const BOX_SIZE = UNIT_PIXEL * 2;
const PLANE_Y_OFFSET = - BOX_SIZE * 4;
const DIMENTIONS = [
  GRID_SIZE,
  GRID_SIZE,
  GRID_SIZE,
];

const styles = {
  root: {
    position: 'absolute',
    top: 15,
    right: 15,
  },
  sprite: {
    position: 'absolute',
    top: 15,
    left: 15,
  },
  color: {
    width: '36px',
    height: '14px',
    borderRadius: '2px',
  },
  swatch: {
    padding: '5px',
    background: '#fff',
    borderRadius: '1px',
    boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
    display: 'inline-block',
    cursor: 'pointer',
  },
};

class Controls extends React.Component {
  constructor(props) {
    super(props);
    this.state = { displayColorPicker: false };
  }

  _submit() {
    const { submit, voxel, sprite } = this.props;
    const { volume, dims } = shapeCarve(DIMENTIONS, sprite, 0, [
      false, false, false, false, false, false,
    ]);

    const { vertices, faces } = greedyMesh(volume, dims);

    submit({
      voxels: voxel.toArray(),
      vertices,
      faces,
    });
  }

  _handleColorPickerOpen() {
    this.setState({ displayColorPicker: !this.state.displayColorPicker });
  }

  _handleColorPickerClose() {
    this.setState({ displayColorPicker: false });
  }

  _handleColorPickerChange(color) {
    this.props.actions.setColor(color.rgb);
  }

  render() {
    const { color } = this.props;
    const menuItem = {
      marginLeft: 7
    };

    return <div>
      <MenuBar rootElement={this.props.rootElement}></MenuBar>
      <div style={styles.root}>
        <div>
          <RaisedButton label="Submit" primary={true} onClick={this._submit.bind(this)}/>
        </div>
        <div>
          <div style={styles.swatch} onClick={ this._handleColorPickerOpen.bind(this) }>
            <div style={{
              backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
              ...styles.color
            }} />
          </div>
        </div>
        <ColorPicker
          color={ this.props.color }
          position="left"
          display={ this.state.displayColorPicker }
          onChange={ this._handleColorPickerChange.bind(this) }
          onClose={ this._handleColorPickerClose.bind(this) }
          type="sketch" />
      </div>
    </div>;
  }
}

export default connect(state => ({
voxel: state.voxel,
color: state.color,
sprite: state.sprite,
}), dispatch => ({
  actions: bindActionCreators({
    ...SpriteActions,
    ...ColorActions
  }, dispatch),
}))(Controls);
