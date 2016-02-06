import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../HandlerInterface';

import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../../Constants';

const handler: StoreHandler = (listen, {
  objectManager,
  stateLayer,
  camera,
}) => listen.move(params => {
  const { group } = objectManager.find(params.object.id);

  // Rotate
  var pos = new THREE.Vector3();
  pos.x = BOX_SIZE * params.to.x - PIXEL_UNIT;
  pos.z = BOX_SIZE * params.to.z - PIXEL_UNIT;
  pos.y = group.position.y;
  group.lookAt(pos);

  // Move
  group.position.x = pos.x;
  group.position.z = pos.z;

  if (params.object.id === stateLayer.store.myId) {
    camera.position.copy(group.position);
  }
});

export default handler;
