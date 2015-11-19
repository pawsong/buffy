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

import { getCameraId } from '../SpriteCameras';
import SpriteCameras from '../SpriteCameras';

import shapeCarve from '../shapeCarve';
import greedyMesh from '../greedyMesh';

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
    //submit(voxel.toArray());
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

  _loadSprites() {
    return new Promise((resolve, reject) => {
      getPixels('/assets/link.png', (err, pixels) => {
        if (err) { return reject(err); }

        //Get array shape
        const nx = pixels.shape[0];
        const ny = pixels.shape[1];

        const actions = [];

        const parseImage = (px, py, camera, rotate = 0) => {
          const { front, up } = camera;
          const left = up.clone().cross(front);

          //Loop over all cells
          for(let i = px; i < px + GRID_SIZE; ++i) {
            for(let j = py; j < py + GRID_SIZE; ++j) {
              const color = [];
              for (let k = 0; k < 4; ++k) {
                const c = pixels.get(i, j, k);
                color.push(c);
              }

              // [ i + 1, ny - j ] x [ left ]
              //                       up
              let n1, n2;

              if (rotate === 1) {
                n1 = i + 1 - px;
                n2 = GRID_SIZE - j + py;
              } else if (rotate === 2) {
                n1 = GRID_SIZE - j + py;
                n2 = GRID_SIZE - i + px;
              } else if (rotate === 3) {
                n1 = i + 1 - px;
                n2 = j + 1 - py;
              } else {
                n1 = GRID_SIZE - i + px;
                n2 = j + 1 - py;
              }

              const x = n1 * left.x + n2 * up.x;
              const y = n1 * left.y + n2 * up.y;
              const z = n1 * left.z + n2 * up.z;

              actions.push({
                front: camera.front,
                up: camera.up,
                position: { x: Math.abs(x), y: Math.abs(y), z: Math.abs(z) },
                color: { r: color[0], g: color[1], b: color[2], a: color[3] }
              });
            }
          }
        }

        parseImage(0, 0, SpriteCameras.right, 2);
        parseImage(GRID_SIZE, 0, SpriteCameras.left, 2);

        parseImage(0, GRID_SIZE, SpriteCameras.top);
        parseImage(GRID_SIZE, GRID_SIZE, SpriteCameras.bottom);

        parseImage(0, 2 * GRID_SIZE, SpriteCameras.front, 1);
        parseImage(GRID_SIZE, 2 * GRID_SIZE, SpriteCameras.back, 1);

        this.props.actions.fillSpriteBatch(actions);
      });
    });
  }

  render() {
    const { color } = this.props;
    return <div style={styles.root}>
      <RaisedButton label="Submit" primary={true} onClick={this._submit.bind(this)}/>
      <div style={styles.swatch} onClick={ this._handleColorPickerOpen.bind(this) }>
        <div style={{
          backgroundColor: `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`,
          ...styles.color
        }} />
    </div>
    <ColorPicker
      color={ this.props.color }
      position="left"
      display={ this.state.displayColorPicker }
      onChange={ this._handleColorPickerChange.bind(this) }
      onClose={ this._handleColorPickerClose.bind(this) }
      type="sketch" />
    <RaisedButton label="Load Sprites" primary={true} onClick={this._loadSprites.bind(this)}/>
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
