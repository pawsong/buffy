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

abstract class UserGameObject extends GameObject {
  map: ServerGameMap;
  send: Send;

  constructor(serialized: SerializedGameObject, map: ServerGameMap) {
    super(serialized);
    this.map = map;
    this.send = new SendImpl((event, params) => this.emit(event, params));
  }

  abstract emit(event: string, params: Object);
}

export default UserGameObject;
