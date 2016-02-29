import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';

const handler: StoreHandler = (listen, {
  objectManager,
  stateLayer,
  camera,
}) => listen.rotate(params => {
  console.log(params);
  const { group } = objectManager.find(params.object.id);

  var pos = group.position.clone();
  pos.x += params.direction.x;
  pos.y += params.direction.y;
  pos.z += params.direction.z;
  group.lookAt(pos);
});

export default handler;
