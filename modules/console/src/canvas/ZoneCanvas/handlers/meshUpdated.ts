import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneCanvas from '../ZoneCanvas';

export default <StoreHandler<ZoneCanvas>>((listen, view) => listen.meshUpdated(params => {
  const loader = view.designManager.getLoader(params.designId);
  loader.loadFromMemory(params.designId, params.mesh);
}));
