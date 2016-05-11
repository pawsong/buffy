import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneCanvas from '../ZoneCanvas';

export default <StoreHandler<ZoneCanvas>>((listen, view) => listen.rotate(params => {
  const { group } = view.objectManager.find(params.object.id);

  var pos = group.position.clone();
  pos.x += params.direction.x;
  pos.y += params.direction.y;
  pos.z += params.direction.z;
  group.lookAt(pos);
}));
