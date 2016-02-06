import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../HandlerInterface';

const handler: StoreHandler = (listen, {
  objectManager,
}) => listen.meshUpdated(params => {
  const object = objectManager.find(params.object.id);
  object.changeMesh(params.object.mesh);
});

export default handler;
