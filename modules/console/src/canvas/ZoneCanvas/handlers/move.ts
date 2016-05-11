import * as THREE from 'three';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneCanvas from '../ZoneCanvas';

import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../../Constants';

const posToLookAt = new THREE.Vector3();

export default <StoreHandler<ZoneCanvas>>((listen, view, stateLayer, getState) => listen.move(params => {
  const { group } = view.objectManager.find(params.object.id);

  const oldPosX = group.position.x;
  const oldPosZ = group.position.z;

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

  const state = getState();

  if (params.object.id === state.playerId) {
    const deltaX = group.position.x - oldPosX;
    const deltaZ = group.position.z - oldPosZ;

    view.addCameraPosition({
      x: group.position.x - oldPosX,
      y: 0,
      z: group.position.z - oldPosZ,
    });
  }
}));
