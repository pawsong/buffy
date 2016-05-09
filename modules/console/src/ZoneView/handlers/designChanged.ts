import { StoreEvents, StoreListen } from '@pasta/core/lib/store/Events';
import { StoreHandler } from '../interface';
import ZoneView from '../ZoneView';

export default <StoreHandler<ZoneView>>((listen, view) => listen.designChanged(params => {
  params.objects.forEach(object => view.objectManager.changeDesign(object.id, object.designId));
}));
