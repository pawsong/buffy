import loop from 'frame-loop';

import ObjectManager from '@pasta/game-store/src/classes/ObjectManager';
import ServerGameObject from '@pasta/game-store/src/classes/ServerGameObject';

const manager = new ObjectManager(ServerGameObject);

const engine = loop(dt => {
  manager.update(dt);
});
engine.run();

engine.on('fps', fps => {
  console.log('fps=', fps);
});

export default manager;
