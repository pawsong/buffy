import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneView from '../ZoneView';

export default <StoreHandler<ZoneView>>((listen, view) => listen.objectRemoved(params => {
  view.objectManager.remove(params.id);
}));
