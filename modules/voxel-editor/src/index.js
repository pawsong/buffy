import 'whatwg-fetch';
import initVoxelView from './views/voxel';
import initSpriteView from './views/sprite';
import initControlView from './views/control';

// TODO: submit can be performed by ajax call
export default function init(container, parent, submit) {
  // OrbitControls patch
  require('./OrbitControls');

  initSpriteView(container);
  initControlView(container, submit);

  const { render } = initVoxelView(container, parent);
  return { render };
}
