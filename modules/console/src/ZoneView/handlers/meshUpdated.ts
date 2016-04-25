import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneView from '../ZoneView';

export default <StoreHandler<ZoneView>>((listen, view) => listen.meshUpdated(params => {
  const object = view.objectManager.find(params.object.id);
  object.changeMesh(params.object.mesh);
}));
