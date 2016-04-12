import GameObject from '@pasta/core/lib/classes/GameObject';
import { SerializedGameObject } from '@pasta/core/lib/classes/GameObject';
import { ZC } from '@pasta/core/lib/packet';
import ClientGameMap from './ClientGameMap';
import { EventEmitter } from 'fbemitter';

function Send(socket) {
  this.socket = socket;
}

ZC.SendEvents.forEach(event => {
  Send.prototype[event] = function (params) {
    return this.socket.emit(event, params);
  };
});

class GameUser extends GameObject {
  owner: string;

  map: ClientGameMap;
  socket: EventEmitter;
  send: ZC.Send;

  constructor(socket, owner: string, options: SerializedGameObject) {
    super(options);
    this.socket = socket;
    this.send = new Send(socket);
  }
}

export default GameUser;
