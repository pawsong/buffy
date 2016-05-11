import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneCanvas from '../ZoneCanvas';

export default <StoreHandler<ZoneCanvas>>((listen, view) => listen.designChanged(params => {
  params.objects.forEach(object => view.objectManager.changeDesign(object.id, object.designId));
}));
