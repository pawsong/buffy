import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneCanvas from '../ZoneCanvas';

export default <StoreHandler<ZoneCanvas>>(({
  store,
  canvas,
}) => store.subscribe.meshUpdated(params => {
  const loader = canvas.designManager.getLoader(params.designId);
  loader.loadFromMemory(params.designId, params.mesh);
}));
