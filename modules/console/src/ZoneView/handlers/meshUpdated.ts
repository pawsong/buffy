import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneView from '../ZoneView';

export default <StoreHandler<ZoneView>>((listen, view) => listen.meshUpdated(params => {
  const loader = view.designManager.getLoader(params.designId);
  loader.loadFromMemory(params.designId, params.mesh);
}));
