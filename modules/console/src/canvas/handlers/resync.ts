import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';

const handler: StoreHandler = (listen, {
  resyncToStore,
}) => listen.resync(() => {
  resyncToStore();
});

export default handler;