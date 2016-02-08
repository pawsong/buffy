import { ToolStateFactory } from '../interface';
import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../../Constants';

const factory: ToolStateFactory = ({
  container,
  stateLayer,
  scene,
  camera,
  raycaster,
  terrainManager,
  cursorManager,
}) => {
  function onMouseDown(event) {
    event.preventDefault();

    const { hit, position } = cursorManager.getPosition();
    if (!hit) { return; }

    stateLayer.rpc.move({
      id: stateLayer.store.myId,
      x: position.x,
      z: position.z,
    });
  }

  return {
    onEnter() {
      cursorManager.start();
      container.addEventListener('mousedown', onMouseDown, false);
    },

    onLeave() {
      cursorManager.stop();
      container.removeEventListener('mousedown', onMouseDown, false);
    },
  };
};

export default factory;