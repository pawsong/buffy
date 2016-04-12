import * as THREE from 'three';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';

import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../Constants';

const posToLookAt = new THREE.Vector3();

const handler: StoreHandler = (listen, {
  objectManager,
  stateLayer,
  camera,
}) => listen.move(params => {
  const { group } = objectManager.find(params.object.id);

  // Move
  group.position.x = BOX_SIZE * params.object.position.x - PIXEL_UNIT;
  group.position.z = BOX_SIZE * params.object.position.z - PIXEL_UNIT;

  // Rotate
  posToLookAt.set(
    group.position.x + params.object.direction.x,
    group.position.y + params.object.direction.y,
    group.position.z + params.object.direction.z
  );
  group.lookAt(posToLookAt);

  if (params.object.id === stateLayer.store.myId) {
    camera.position.copy(group.position);
  }
});

export default handler;
