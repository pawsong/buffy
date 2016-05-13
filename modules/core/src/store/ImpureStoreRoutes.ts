import * as ZC from '../packet/ZC';
import GameObject from '../classes/GameObject';
import Terrain from '../classes/Terrain';
import StoreRoutes from './StoreRoutes';

class RemoteStoreRoutes extends StoreRoutes {
  _init(params: ZC.InitParams) {
    this.store.deserialize(params);
  }

  _move(params: ZC.MoveParams) {
    const object = this.store.findObject(params.id);
    if (!object) {
      // TODO: Request missing object data to server.
      // Out of sync in this case. We may have to reset all data.
      console.error('Client and server out of sync!');
      console.error(`Cannot find object ${params.id}`);
      return;
    }
    object.tween.deserialize(params.tween);
  }

  _stop(params: ZC.StopParams) {
    const object = this.store.findObject(params.id);
    if (!object) {
      // TODO: Request missing object data to server.
      // Out of sync in this case. We may have to reset all data.
      console.error('Client and server out of sync!');
      console.error(`Cannot find object ${params.id}`);
      return;
    }
    object.tween.stop();
  }

  _rotate(params: ZC.RotateParams, object: GameObject) {
    // TODO: Perform rotation during multiple frames
    object.direction.deserialize(params.direction);
  }

  _objectAdded(params: ZC.ObjectAddedParams): GameObject {
    const zone = this.store.findZone(params.object.zone);
    const object = new GameObject(params.object, zone);

    object.zone.objects.push(object);

    this.store.objects[object.id] = object;
    return object;
  }

  _objectRemoved(params: ZC.ObjectRemovedParams, object: GameObject) {
    delete this.store.objects[params.id];
    object.zone.removeObject(object);
  }

  _terrainUpdated(params: ZC.TerrainUpdatedParams): Terrain {
     const zone = this.store.findZone(params.zoneId);
     return zone.updateTerrain(params.terrain);
  }

  _robotUpdated(params: ZC.RobotUpdatedParams, objects: GameObject[]) {
    objects.forEach(object => object.designId = params.design);
  }
}

export default RemoteStoreRoutes;
