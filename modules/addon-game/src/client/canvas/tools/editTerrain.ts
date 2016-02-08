import { ToolStateFactory } from '../interface';
import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../../Constants';

import { observeStore } from '../../store';

export function rgbToHex({ r, g, b }) {
  return (1 << 24) | (r << 16) | (g << 8) | b;
}

const factory: ToolStateFactory = ({
  container,
  stateLayer,
  scene,
  camera,
  raycaster,
  terrainManager,
  cursorManager,
  store,
}) => {
  function onMouseDown(event) {
    event.preventDefault();

    const { hit, position } = cursorManager.getPosition();
    if (!hit) { return; }

    const state = store.getState();

    stateLayer.rpc.updateTerrain({
      x: position.x,
      z: position.z,
      color: rgbToHex(state.brush.color),
    });
  }

  let token;

  return {
    onEnter() {
      cursorManager.start();
      container.addEventListener('mousedown', onMouseDown, false);

      token = observeStore(store, state => state.brush, ({ color }) => {
        cursorManager.setColor(rgbToHex(color));
      });
    },

    onLeave() {
      token.remove();

      cursorManager.stop();
      container.removeEventListener('mousedown', onMouseDown, false);
    },
  };
};

export default factory;
