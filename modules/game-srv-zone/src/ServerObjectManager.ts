'use strict';

import { GameObjectManager } from '@pasta/game-class';
import ServerGameObject from './classes/ServerGameObject';

const manager = new GameObjectManager(ServerGameObject);

// TODO: Static 20fps, is this OK?
let oldTime = Date.now();
function update() {
  const now = Date.now();
  const dt = now - oldTime;
  manager.update(dt);
  oldTime = now;
  setTimeout(update, 1000 / 20);
}
update();

export default manager;
