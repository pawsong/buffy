import { ToolStateFactory, RemoveObserver } from '../interface';
import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../../Constants';

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
  getGameState,
  observeGameState,
}) => {
  function onMouseDown(event) {
    event.preventDefault();

    const { hit, position } = cursorManager.getPosition();
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
      cursorManager.start();
      container.addEventListener('mousedown', onMouseDown, false);

      removeObserver = observeGameState(gameState => gameState.brushColor, brushColor => {
        cursorManager.setColor(rgbToHex(brushColor));
      });
    },

    onLeave() {
      removeObserver();

      cursorManager.stop();
      container.removeEventListener('mousedown', onMouseDown, false);
    },
  };
};

export default factory;
