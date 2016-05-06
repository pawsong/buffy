import { SerializedGameObject } from '@pasta/core/lib/classes/GameObject';
import UserGameObject, { Socket } from '@pasta/core/lib/packet/UserGameObject';
import ServerGameMap from '@pasta/core/lib/packet/ServerGameMap';
import LocalSocket from './LocalSocket';

// Local socket is only one.
const LOCAL_SOCKET_ID = 'LOCAL_SOCKET_ID';

class LocalUserGameObject extends UserGameObject {
  socket: LocalSocket;

  constructor(serialized: SerializedGameObject, map: ServerGameMap, socket: LocalSocket) {
    super(serialized, map);
    this.socket = socket;
  }

  getSocket() {
    return this.socket;
  }

  getSocketId() {
    return LOCAL_SOCKET_ID;
  }
}

export default LocalUserGameObject;
