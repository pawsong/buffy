import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneCanvas from '../ZoneCanvas';

export default <StoreHandler<ZoneCanvas>>(({
  store,
  canvas,
}) => store.subscribe.objectRemoved(params => {
  canvas.objectManager.remove(params.id);
}));
