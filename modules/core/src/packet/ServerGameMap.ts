const findIndex = require('lodash/findIndex');

import GameMap, { SerializedGameMap } from '../classes/GameMap';
import { Broadcast, BroadcastEvents } from './ZC';
import UserGameObject from './UserGameObject';

function BroadcastImpl(users) {
  this.users = users;
}

BroadcastEvents.forEach(event => {
  BroadcastImpl.prototype[event] = function (params) {
    (<UserGameObject[]>this.users).forEach(user => user.emit(event, params));
  };
});

class ServerGameMap extends GameMap {
  users: UserGameObject[];
  broadcast: Broadcast;

  constructor(serialized: SerializedGameMap) {
    super(serialized);
    this.users = [];
    this.broadcast = new BroadcastImpl(this.users);
  }

  addUser(user: UserGameObject) {
    this.addObject(user);

    this.users.push(user);
    this.broadcast.objectAdded({ object: user.serialize() });
  }

  removeUser(user: UserGameObject) {
    this.removeObject(user);

    this.broadcast.objectRemoved({ id: user.id });
    const idx = findIndex(this.users, { id: user.id });
    if (idx !== -1) this.users.splice(idx, 1);
  }
}

export default ServerGameMap;
