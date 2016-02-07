import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';

const handler: StoreHandler = (listen, {
  effectManager,
}) => listen.playEffect(params => {
  effectManager.create('fire', params.duration, {
    x: params.x,
    z: params.z,
  });
});

export default handler;
