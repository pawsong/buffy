import loop from 'frame-loop';

import { GameObjectManager } from '@pasta/game-class';
import ServerGameObject from './classes/ServerGameObject';

const manager = new GameObjectManager(ServerGameObject);

const engine = loop(dt => {
  manager.update(dt);
});
engine.run();

engine.on('fps', fps => {
  // console.log('fps=', fps);
});

export default manager;
