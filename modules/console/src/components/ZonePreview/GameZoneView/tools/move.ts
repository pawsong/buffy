import { ToolStateFactory } from '../interface';
import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../../Constants';

export default <ToolStateFactory>((view, stateLayer, getGameState, observeGameState) => {
  function onMouseDown(event) {
    event.preventDefault();

    const { hit, position } = view.cursorManager.getPosition();
    if (!hit) { return; }

    stateLayer.rpc.move({
      id: stateLayer.store.myId,
      x: position.x,
      z: position.z,
    });
  }

  return {
    onEnter() {
      view.cursorManager.start();
      view.container.addEventListener('mousedown', onMouseDown, false);
    },

    onLeave() {
      view.cursorManager.stop();
      view.container.removeEventListener('mousedown', onMouseDown, false);
    },
  };
});
