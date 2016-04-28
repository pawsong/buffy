import { ToolStateFactory, RemoveObserver } from '../interface';
import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../../Constants';

export function rgbToHex({ r, g, b }) {
  return (1 << 24) | (r << 16) | (g << 8) | b;
}

export default <ToolStateFactory>((view, stateLayer, getGameState, observeGameState) => {
  function onMouseDown(event) {
    event.preventDefault();

    const { hit, position } = view.cursorManager.getPosition();
    if (!hit) { return; }

    const gameState = getGameState();

    stateLayer.rpc.updateTerrain({
      x: position.x,
      z: position.z,
      color: rgbToHex(gameState.brushColor),
    });
  }

  let removeObserver: RemoveObserver;

  return {
    onEnter() {
      view.cursorManager.start();
      view.container.addEventListener('mousedown', onMouseDown, false);

      removeObserver = observeGameState(gameState => gameState.brushColor, brushColor => {
        view.cursorManager.setColor(rgbToHex(brushColor));
      });
    },

    onLeave() {
      removeObserver();

      view.cursorManager.stop();
      view.container.removeEventListener('mousedown', onMouseDown, false);
    },
  };
});
