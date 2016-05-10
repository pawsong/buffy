import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneCanvas from '../ZoneCanvas';

export default <StoreHandler<ZoneCanvas>>((listen, view) => listen.playEffect(params => {
  view.effectManager.create('fire', params.duration, {
    x: params.x,
    z: params.z,
  });
}));
