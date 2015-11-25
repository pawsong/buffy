import React from 'react';
import { bindActionCreators } from 'redux';
import Promise from 'bluebird';
import getPixels from 'get-pixels';

import IconMenu from './icon-menu';
import MenuItem from 'material-ui/lib/menus/menu-item';
import RootIcon from './RootIcon';
import NotImplDialog from './NotImplDialog';

import { connect } from 'react-redux';
import * as ColorActions from '../../actions/color';
import * as SpriteActions from '../../actions/sprite';

import SpriteCameras from '../../SpriteCameras';

const GRID_SIZE = 16;
const UNIT_PIXEL = 25;
const BOX_SIZE = UNIT_PIXEL * 2;
const PLANE_Y_OFFSET = - BOX_SIZE * 4;
const DIMENTIONS = [
  GRID_SIZE,
  GRID_SIZE,
  GRID_SIZE,
];

const EditIconMenu = React.createClass({
  getInitialState() {
    return {
      showNotImplDialog: false,
    };
  },

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
  },

  render() {
    return <div style={{ display: 'inline-block' }}>
      <IconMenu {...this.props} width={192} iconButtonElement={ <RootIcon>Edit</RootIcon> }>
        <MenuItem primaryText="Load sprites" secondaryText="⌘O"
          onTouchTap={this._loadSprites}/>
      </IconMenu>
    </div>
  },
});

export default EditIconMenu;
