import * as _ from 'lodash';
import GameMap from '@pasta/core/lib/classes/GameMap';
import { SerializedGameMap } from '@pasta/core/lib/classes/GameMap';
import { ZC } from '@pasta/core/lib/packet';
import GameUser from './GameUser';

function Broadcast(users) {
  this.users = users;
}

ZC.BroadcastEvents.forEach(event => {
  Broadcast.prototype[event] = function (params) {
    this.users.forEach(user => user.socket.emit(event, params));
  };
});

class ServerGameMap extends GameMap {
  users: GameUser[];
  broadcast: ZC.Broadcast;

  constructor(data: SerializedGameMap) {
    super(data);

    this.users = [];
    this.broadcast = new Broadcast(this.users);
  }

  addUser(user: GameUser) {
    this.addObject(user);
    this.users.push(user);
  }

  removeUser(user: GameUser) {
    const idx = _.findIndex(this.users, { id: user.id });
    if (idx !== -1) {
      this.users.splice(idx, 1);
    }
    this.removeObject(user);
  }
}

export default ServerGameMap;
