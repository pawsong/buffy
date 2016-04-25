import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneView from '../ZoneView';

export default <StoreHandler<ZoneView>>((listen, view) => listen.terrainUpdated(params => {
  view.terrainManager.findAndUpdate(params.terrain.position.x, params.terrain.position.z, params.terrain.color);
}));
