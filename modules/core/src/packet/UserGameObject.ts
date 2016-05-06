import GameObject, { SerializedGameObject } from '../classes/GameObject';
import ServerGameMap from './ServerGameMap';
import { Send, SendEvents } from './ZC';

function SendImpl(emit) {
  this.emit = emit;
}

SendEvents.forEach(event => {
  SendImpl.prototype[event] = function (params) {
    return this.emit(event, params);
  };
});

export interface Socket {
  emit(event: string, params: Object): any;
}

abstract class UserGameObject extends GameObject {
  send: Send;
  zone: ServerGameMap;

  constructor(serialized: SerializedGameObject, map: ServerGameMap) {
    super(serialized, map);

    const socket = this.getSocket();
    this.send = new SendImpl((event, params) => socket.emit(event, params));
  }

  abstract getSocket(): Socket;
  abstract getSocketId(): string;
}

export default UserGameObject;
