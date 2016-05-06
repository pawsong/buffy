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
    super(user);
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
    // TODO: Validate params.
    // TODO: Check permission.

    const map = await GameMapManager.findOrCreate(params.id);

    this.user.map.removeUser(this.user);

    this.user.send.init({
      myId: this.user.id,
      map: map.serialize(),
    });

    // TODO: Move user to map's gate position
    this.user.map = map;
    this.user.position.x = 1;
    this.user.position.z = 1;
    map.addUser(this.user);
  }

  protected async updateTerrainInDB(params: UpdateTerrainParams) {
    await Terrain.findOneAndUpdate({
      map: this.user.map.id,
      loc: { x: params.x, z: params.z },
    }, {
      color: params.color,
    }, { new: true, upsert: true }).exec();
  }
}

export default AreaRoutes;
