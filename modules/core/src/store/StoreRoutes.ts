import * as ZC from '../packet/ZC';
import StateStore from '../StateStore';
import GameObject from '../classes/GameObject';
import Terrain from '../classes/Terrain';

abstract class StoreRoutes implements ZC.Listen {
  protected store: StateStore;

  constructor(store: StateStore) {
    this.store = store;
  }

  abstract _init(params: ZC.InitParams): void;
  init(params: ZC.InitParams) {
    this._init(params);

    const zoneIds = params.zones.map(zone => zone.id);
    this.store.emit.resync({ zoneIds });
  }

  abstract _move(params: ZC.MoveParams): void;
  move(params: ZC.MoveParams) {
    this._move(params);
  }

  abstract _stop(params: ZC.StopParams): void;
  stop(params: ZC.StopParams) {
    this._stop(params);
  }

  abstract _rotate(params: ZC.RotateParams, object: GameObject): void;
  rotate(params: ZC.RotateParams) {
    const object = this.store.findObject(params.id);
    if (!object) {
      // TODO: Request missing object data to server.
      // Out of sync in this case. We may have to reset all data.
      console.error('Client and server out of sync!');
      console.error(`Cannot find object ${params.id}`);
      return;
    }

    this._rotate(params, object);

    this.store.emit.rotate({
      object,
      direction: object.direction,
    });
  }

  abstract _objectAdded(params: ZC.ObjectAddedParams): GameObject;
  objectAdded(params: ZC.ObjectAddedParams) {
    const object = this._objectAdded(params);
    this.store.emit.objectAdded({ object });
  }

  abstract _objectRemoved(params: ZC.ObjectRemovedParams, object: GameObject): void;
  objectRemoved(params: ZC.ObjectRemovedParams) {
    const object = this.store.findObject(params.id);
    this._objectRemoved(params, object);
    this.store.emit.objectRemoved({ id: object.id });
  }

  playEffect(params: ZC.PlayEffectParams) {
    this.store.emit.playEffect(params);
  }

  abstract _terrainUpdated(params: ZC.TerrainUpdatedParams): Terrain;
  terrainUpdated(params: ZC.TerrainUpdatedParams) {
    const terrain = this._terrainUpdated(params);
    this.store.emit.terrainUpdated({ terrain });
  }

  meshUpdated(params: ZC.MeshUpdatedParams) {
    this.store.emit.meshUpdated(params);
  }

  abstract _robotUpdated(params: ZC.RobotUpdatedParams, objects: GameObject[]): void;
  robotUpdated(params: ZC.RobotUpdatedParams) {
    const objects = [];
    this.store.forEachObject(object => {
      if (object.robot === params.robot) objects.push(object);
    });

    this._robotUpdated(params, objects);
    this.store.emit.designChanged({
      objects,
    });
  }
}

export default StoreRoutes;
