const findIndex = require('lodash/findIndex');

import GameMap, { SerializedGameMap } from '../classes/GameMap';
import { Broadcast, BroadcastEvents } from './ZC';
import UserGameObject, { Socket } from './UserGameObject';

function BroadcastImpl(sockets) {
  this.sockets = sockets;
}

BroadcastEvents.forEach(event => {
  BroadcastImpl.prototype[event] = function (params) {
    (<Socket[]>this.sockets).forEach(socket => socket.emit(event, params));
  };
});

class ServerGameMap extends GameMap {
  sockets: Socket[];
  socketRefs: { [index: string]: number };
  broadcast: Broadcast;

  constructor(serialized: SerializedGameMap) {
    super(serialized);
    this.sockets = [];
    this.socketRefs = {};
    this.broadcast = new BroadcastImpl(this.sockets);
  }

  addUser(user: UserGameObject) {
    const socket = user.getSocket();
    if (this.sockets.indexOf(socket) === -1) this.sockets.push(socket);

    const socketId = user.getSocketId();
    this.socketRefs[socketId] = (this.socketRefs[socketId] || 0) + 1;

    this.addObject(user);
    this.broadcast.objectAdded({ object: user.serialize() });
  }

  removeUser(user: UserGameObject) {
    this.broadcast.objectRemoved({ id: user.id });
    this.removeObject(user);

    const socketId = user.getSocketId();
    this.socketRefs[socketId] = (this.socketRefs[socketId] || 1) - 1;

    if (this.socketRefs[socketId] <= 0) {
      delete this.socketRefs[socketId];

      const socket = user.getSocket();
      const index = this.sockets.indexOf(socket);
      if (index !== -1) this.sockets.splice(index, 1);
    }
  }
}

export default ServerGameMap;
