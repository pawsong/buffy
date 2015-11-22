import { vector3ToString } from '@pasta/helper-public';
import SpriteCameras, { getCameraId } from '../../SpriteCameras';

import store, {
  actions,
  observeStore,
} from '../../store';

import * as ActionTypes from '../../constants/ActionTypes';

import {
  GRID_SIZE
} from '../../constants/Pixels';

const UNIT = 6;
const PIXEL_NUM = GRID_SIZE;
const OFFSET = (PIXEL_NUM + 1) * UNIT;

export default function initSpriteEditor(container) {

  const spriteElement = document.createElement('div');
  container.appendChild(spriteElement);
  spriteElement.style.width = '100%';

  function initCanvas({ front, up }, topOffset, leftOffset, elemTopOffset, elemLeftOffset) {
    const two = new Two({
      type: Two.Types.canvas,
      width: UNIT * PIXEL_NUM + 1, height: UNIT * PIXEL_NUM + 1,
    }).appendTo(spriteElement);

    two.renderer.domElement.style.position = 'absolute';
    two.renderer.domElement.style.top = `${elemTopOffset + 30}px`;
    two.renderer.domElement.style.left = `${elemLeftOffset}px`;

    // Set grid
    const rect = two.makeRectangle(
      UNIT * PIXEL_NUM / 2 + 0.5,
      UNIT * PIXEL_NUM / 2 + 0.5,
      UNIT * PIXEL_NUM,
      UNIT * PIXEL_NUM
    );
    for (let i = 1; i < PIXEL_NUM; ++i) {
      two.makeLine(i * UNIT + 0.5, 0, i * UNIT + 0.5, UNIT * PIXEL_NUM);
    }
    for (let i = 1; i < PIXEL_NUM; ++i) {
      two.makeLine(0, i * UNIT + 0.5, UNIT * PIXEL_NUM, i * UNIT + 0.5);
    }
    two.update();

    const left = up.clone().cross(front);

    function getFocus(screen, event) {
      const leftScalar =
        - leftOffset + Math.floor((event.clientX - screen.left) / UNIT) + 1;
      const topScalar =
        - topOffset + PIXEL_NUM - Math.floor((event.clientY - screen.top) / UNIT);

      if (leftScalar === 0 || topScalar === 0) { return; }

      const focus = left.clone()
        .multiplyScalar(leftScalar)
        .add(up.clone().multiplyScalar(topScalar));

      return focus;
    }

    function requestFillPixel(focus) {
      const { color } = store.getState();
      return actions.fillSprite(front, up, focus, color);
    }

    // Mouse event handlers
    two.renderer.domElement.addEventListener('mousemove', function (event) {
      const screen = this.getBoundingClientRect();

      const focus = getFocus(screen, event);
      if (!focus) { return; }

      const curFocus = store.getState().spriteFocus;
      if (curFocus &&
          curFocus.x === focus.x &&
          curFocus.y === focus.y &&
          curFocus.z === focus.z) {
        return;
      }

      actions.focusSprite(focus);

      if (event.buttons === 1) {
        requestFillPixel(focus);
      }
    }, false);

    two.renderer.domElement.addEventListener('mousedown', function (event) {
      const screen = this.getBoundingClientRect();

      const focus = getFocus(screen, event);
      if (!focus) { return; }

      requestFillPixel(focus);
    }, false);

    two.renderer.domElement.addEventListener('mouseleave', function (e) {
      actions.focusSprite(null);
    }, false);

    two.renderer.domElement.addEventListener('mouseout', function (e) {
      actions.focusSprite(null);
    }, false);

    /**
     * @return Rectangle two.js rectangle
     */
    function createPixel(position) {
      const leftDot = left.dot(position);
      const topDot = up.dot(position);

      let leftPos;
      let topPos;
      let width;
      let height;

      if (leftDot === 0) {
        leftPos = PIXEL_NUM / 2 + 0.5;
        width = PIXEL_NUM;
      } else {
        leftPos = leftDot + leftOffset;
        width = 1;
      }

      if (topDot === 0) {
        topPos = PIXEL_NUM / 2 + 0.5;
        height = PIXEL_NUM;
      } else {
        topPos = topDot + topOffset;
        height = 1;
      }

      return two.makeRectangle(
        (leftPos - 0.5) * UNIT + 0.5,
        (PIXEL_NUM - topPos + 0.5) * UNIT + 0.5,
        width * UNIT,
        height * UNIT
      );
    }

    // store event handlers
    let focusRect = null;
    observeStore(state => state.spriteFocus, focus => {
      if (focusRect) {
        two.remove(focusRect);
        focusRect = null;
      }

      if (!focus) {
        return two.update();
      }

      focusRect = createPixel(focus);
      focusRect.fill = 'rgb(255, 0, 255)';
      focusRect.opacity = 0.75;

      return two.update();
    });

    function fillPixel(position, color) {
      const pixelId = vector3ToString(position);

      let pixel = pixels[pixelId];
      if (!pixel) {
        pixel = createPixel(position);
        pixels[pixelId] = pixel;
      }
      pixel.fill = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
      return pixel;
    }

    const pixels = {};
    observeStore(state => state.spriteOp, op => {
      if (op.type === ActionTypes.FILL_SPRITE_BATCH) {
        const { sprite } = store.getState();
        const planeId = getCameraId(front, up);
        const plane = sprite.get(planeId);
        plane.forEach(data => {
          const { position, color } = data;
          fillPixel(position, color);
        });
      } else if (op.type === ActionTypes.FILL_SPRITE) {
        if (op.front !== front || op.up !== up) {
          return;
        }
        const { position, color } = op;
        fillPixel(position, color);
      }
      return two.update();
    });

    return two.update();
  }

  // Front
  initCanvas(
    SpriteCameras.front,
    0, 0,
    UNIT, UNIT
  );

  // Back
  initCanvas(
    SpriteCameras.back,
    0, PIXEL_NUM + 1,
    UNIT, UNIT + OFFSET
  );

  // Top
  initCanvas(
    SpriteCameras.top,
    PIXEL_NUM + 1, PIXEL_NUM + 1,
    UNIT + OFFSET, UNIT
  );

  // Bottom
  initCanvas(
    SpriteCameras.bottom,
    0, PIXEL_NUM + 1,
    UNIT + OFFSET, UNIT + OFFSET
  );

  // Left
  initCanvas(
    SpriteCameras.left,
    0, PIXEL_NUM + 1,
    UNIT + 2 * OFFSET, UNIT
  );

  // Right
  initCanvas(
    SpriteCameras.right,
    0, 0,
    UNIT + 2 * OFFSET, UNIT + OFFSET
  );
};
