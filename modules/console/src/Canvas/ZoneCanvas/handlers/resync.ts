import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneCanvas from '../ZoneCanvas';

export default <StoreHandler<ZoneCanvas>>((listen, view, stateLayer, getState) => listen.resync(() => {
  const state = getState();
  const object = stateLayer.store.findObject(state.playerId);
  view.resyncToStore(object);
}));
