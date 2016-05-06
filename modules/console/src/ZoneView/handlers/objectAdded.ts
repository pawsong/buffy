import * as THREE from 'three';
import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneView from '../ZoneView';

import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../Constants';

export default <StoreHandler<ZoneView>>((listen, view, stateLayer) => listen.objectAdded(params => {
  const { object: obj } = params;
  const object = view.objectManager.create(obj.id, obj.designId);
  object.add(new THREE.Mesh( view.cubeGeometry, view.cubeMaterial ));

  const { group } = object;

  group.position.x = BOX_SIZE * obj.position.x - PIXEL_UNIT;
  group.position.z = BOX_SIZE * obj.position.z - PIXEL_UNIT;
  group.position.y = PIXEL_UNIT;

  group.lookAt(new THREE.Vector3(
    group.position.x,
    group.position.y,
    group.position.z
  ));

  if (obj.id === stateLayer.store.myId) {
    view.camera.position.copy(group.position);
  }
}));
