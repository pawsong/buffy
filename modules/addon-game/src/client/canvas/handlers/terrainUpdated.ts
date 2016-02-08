import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';

const handler: StoreHandler = (listen, {
  terrainManager,
}) => listen.terrainUpdated(params => {
  terrainManager.findAndUpdate(params.terrain.position.x, params.terrain.position.z, params.terrain.color);
});

export default handler;
