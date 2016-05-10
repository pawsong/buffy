import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneCanvas from '../ZoneCanvas';

export default <StoreHandler<ZoneCanvas>>((listen, view) => listen.objectRemoved(params => {
  view.objectManager.remove(params.id);
}));
