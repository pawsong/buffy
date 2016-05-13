import * as ZC from '../packet/ZC';
import GameObject from '../classes/GameObject';
import Terrain from '../classes/Terrain';
import StoreRoutes from './StoreRoutes';

class LocalStoreRoutes extends StoreRoutes {
  _init(params: ZC.InitParams) {}

  _move(params: ZC.MoveParams) {
    console.log(params);
  }

  _stop(params: ZC.StopParams) {}

  _rotate(params: ZC.RotateParams, object: GameObject) {}

  _objectAdded(params: ZC.ObjectAddedParams): GameObject {
    return this.store.findObject(params.object.id);
  }

  _objectRemoved(params: ZC.ObjectRemovedParams, object: GameObject) {}

  _terrainUpdated(params: ZC.TerrainUpdatedParams): Terrain {
    return null;
  }

  _robotUpdated(params: ZC.RobotUpdatedParams, objects: GameObject[]) {}
}

export default LocalStoreRoutes;
