import { SerializedGameObject } from '@pasta/core/lib/classes/GameObject';
import UserGameObject from '@pasta/core/lib/packet/UserGameObject';
import ServerGameMap from '@pasta/core/lib/packet/ServerGameMap';

class AreaUserGameObject extends UserGameObject {
  socket: SocketIO.Socket;

  constructor(serialized: SerializedGameObject, map: ServerGameMap, socket: SocketIO.Socket) {
    super(serialized, map);
    this.socket = socket;
  }

  emit(event: string, params: Object) {
    this.socket.emit(event, params);
  }
}

export default AreaUserGameObject;
