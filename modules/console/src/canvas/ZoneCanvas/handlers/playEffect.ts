import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneCanvas from '../ZoneCanvas';

export default <StoreHandler<ZoneCanvas>>(({
  store,
  canvas,
}) => store.subscribe.playEffect(params => {
  canvas.effectManager.create('fire', params.duration, {
    x: params.x,
    z: params.z,
  });
}));
