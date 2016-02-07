import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';

const handler: StoreHandler = (listen, {
  objectManager,
}) => listen.objectRemoved(params => {
  objectManager.remove(params.id);
});

export default handler;
