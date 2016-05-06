import {
  MoveMapParams,
  UpdateMeshParams,
  UpdateTerrainParams,
} from '@pasta/core/lib/packet/CZ';
import RoutesCZ from '@pasta/core/lib/packet/RoutesCZ';
import UserGameObject from '@pasta/core/lib/packet/UserGameObject';

import MeshModel from '../models/Mesh';
import GameUserModel from '../models/GameUser';
import Terrain from '../models/Terrain';

import * as GameMapManager from '../GameMapManager';

class AreaRoutes extends RoutesCZ {
  private socket: SocketIO.Socket;

  constructor(user: UserGameObject, socket: SocketIO.Socket) {
    super([user]);
    this.socket = socket;

    this.init();
  }

  protected addListener(event: string, handler: Function) {
    const socket = this.socket.addListener(event, handler);
    return () => socket.removeListener(event, handler);
  }

  destroy() {
    super.destroy();
    this.socket = null;
  }

  async moveMap(params: MoveMapParams) {
    const user = this.getUser(params.objectId);

    // TODO: Validate params.
    // TODO: Check permission.

    const zone = await GameMapManager.findOrCreate(params.zoneId);

    user.zone.removeUser(user);

    user.send.init({
      zones: [zone.serialize()],
      objects: zone.objects.map(object => object.serialize()),
    });

    // TODO: Move user to map's gate position
    user.zone = zone;
    user.position.x = 1;
    user.position.z = 1;
    zone.addUser(user);
  }

  protected async updateTerrainInDB(user: UserGameObject, params: UpdateTerrainParams) {
    await Terrain.findOneAndUpdate({
      map: user.zone.id,
      loc: { x: params.x, z: params.z },
    }, {
      color: params.color,
    }, { new: true, upsert: true }).exec();
  }
}

export default AreaRoutes;
