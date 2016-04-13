import { SerializedGameObject } from '@pasta/core/lib/classes/GameObject';
import UserGameObject from '@pasta/core/lib/packet/UserGameObject';
import ServerGameMap from '@pasta/core/lib/packet/ServerGameMap';
import LocalSocket from './LocalSocket';

class LocalUserGameObject extends UserGameObject {
  socket: LocalSocket;

  constructor(serialized: SerializedGameObject, map: ServerGameMap, socket: LocalSocket) {
    super(serialized, map);
    this.socket = socket;
  }

  emit(event: string, params: Object) {
    this.socket.emitFromServerToClient(event, params);
  }
}

export default LocalUserGameObject;
