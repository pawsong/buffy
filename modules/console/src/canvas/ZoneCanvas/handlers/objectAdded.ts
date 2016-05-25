import * as THREE from 'three';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneCanvas from '../ZoneCanvas';

import {
  PIXEL_SCALE,
  PIXEL_SCALE_HALF,
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

  group.position.x = PIXEL_SCALE * obj.position.x - PIXEL_SCALE_HALF;
  group.position.z = PIXEL_SCALE * obj.position.z - PIXEL_SCALE_HALF;
  group.position.y = PIXEL_SCALE_HALF;

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
