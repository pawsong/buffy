import * as THREE from 'three';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneCanvas from '../ZoneCanvas';

import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../../Constants';

export default <StoreHandler<ZoneCanvas>>(({
  store,
  canvas,
  getState,
}) => store.subscribe.objectAdded(params => {
  const { object: obj } = params;
  const object = canvas.objectManager.create(obj.id, obj.designId);
  object.add(new THREE.Mesh( canvas.cubeGeometry, canvas.cubeMaterial ));

  const { group } = object;

  group.position.x = BOX_SIZE * obj.position.x - PIXEL_UNIT;
  group.position.z = BOX_SIZE * obj.position.z - PIXEL_UNIT;
  group.position.y = PIXEL_UNIT;

  group.lookAt(new THREE.Vector3(
    group.position.x,
    group.position.y,
    group.position.z
  ));

  const state = getState();
  if (obj.id === state.playerId) {
    canvas.setCameraPosition(group.position);
  }
}));
