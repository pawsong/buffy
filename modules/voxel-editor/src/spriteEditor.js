import store, {
  actions,
  observeStore,
} from './store';

import * as ActionTypes from './constants/ActionTypes';

const UNIT = 6;
const PIXEL_NUM = 16;
const OFFSET = (PIXEL_NUM + 1) * UNIT;

export default function initSpriteEditor(container) {

  const spriteElement = document.createElement('div');
  container.appendChild(spriteElement);
  spriteElement.style.width = '100%';

  function initCanvas(front, up, topOffset, leftOffset, elemTopOffset, elemLeftOffset) {
    const two = new Two({
      type: Two.Types.canvas,
      width: UNIT * PIXEL_NUM + 1, height: UNIT * PIXEL_NUM + 1,
    }).appendTo(spriteElement);

    two.renderer.domElement.style.position = 'absolute';
    two.renderer.domElement.style.top = `${elemTopOffset}px`;
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

    // Mouse event handlers
    two.renderer.domElement.addEventListener('mousemove', function (e) {
      var screen = this.getBoundingClientRect();
      const leftScalar =
        - leftOffset + Math.floor((e.clientX - screen.left) / UNIT) + 1;
      const topScalar =
        - topOffset + PIXEL_NUM - Math.floor((e.clientY - screen.top) / UNIT);

      if (leftScalar === 0 || topScalar === 0) { return; }

      const focus = left.clone()
        .multiplyScalar(leftScalar)
        .add(up.clone().multiplyScalar(topScalar));

      actions.focusSprite(focus);
    }, false);

    two.renderer.domElement.addEventListener('mouseleave', function (e) {
      actions.focusSprite(null);
    }, false);

    two.renderer.domElement.addEventListener('mouseout', function (e) {
      actions.focusSprite(null);
    }, false);

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

      const leftDot = left.dot(focus);
      const topDot = up.dot(focus);

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

      focusRect = two.makeRectangle(
        (leftPos - 0.5) * UNIT + 0.5,
        (PIXEL_NUM - topPos + 0.5) * UNIT + 0.5,
        width * UNIT,
        height * UNIT
      );
      focusRect.fill = 'rgb(255, 0, 255)';
      focusRect.opacity = 0.75;

      return two.update();
    });
  }

  // Front
  initCanvas(
    new THREE.Vector3(1, 0, 0),
    new THREE.Vector3(0, 0, 1),
    0, 0,
    UNIT, UNIT
  );

  // Back
  initCanvas(
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3(0, 0, 1),
    0, PIXEL_NUM + 1,
    UNIT, UNIT + OFFSET
  );

  // Top
  initCanvas(
    new THREE.Vector3(0, 0, 1),
    new THREE.Vector3(0, -1, 0),
    PIXEL_NUM + 1, PIXEL_NUM + 1,
    UNIT + OFFSET, UNIT
  );

  // Bottom
  initCanvas(
    new THREE.Vector3(0, 0, -1),
    new THREE.Vector3(0, 1, 0),
    0, PIXEL_NUM + 1,
    UNIT + OFFSET, UNIT + OFFSET
  );

  // Left
  initCanvas(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 1),
    0, PIXEL_NUM + 1,
    UNIT + 2 * OFFSET, UNIT
  );

  // Right
  initCanvas(
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0, 0, 1),
    0, 0,
    UNIT + 2 * OFFSET, UNIT + OFFSET
  );

  /*
  // Right
  initCanvas('-y', '+z', UNIT, UNIT);
  */
};
