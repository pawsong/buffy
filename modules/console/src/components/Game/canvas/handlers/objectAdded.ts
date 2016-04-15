import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';

import {
  BOX_SIZE,
  PIXEL_UNIT,
} from '../../Constants';

const handler: StoreHandler = (listen, {
  objectManager,
  stateLayer,
  camera,
  cubeGeometry,
  cubeMaterial,
}) => listen.objectAdded(params => {
  const { object: obj } = params;
  const object = objectManager.create(obj.id);
  object.add(new THREE.Mesh( cubeGeometry, cubeMaterial ));

  const { group } = object;

  group.position.x = BOX_SIZE * obj.position.x - PIXEL_UNIT;
  group.position.z = BOX_SIZE * obj.position.z - PIXEL_UNIT;
  group.position.y = PIXEL_UNIT;

  group.lookAt(new THREE.Vector3(
    group.position.x,
    group.position.y,
    group.position.z
  ));

  if (obj.mesh) {
    object.changeMesh(obj.mesh);
  }

  if (obj.id === stateLayer.store.myId) {
    camera.position.copy(group.position);
  }
});

export default handler;
