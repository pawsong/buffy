import AreaUserGameObject from '../classes/AreaUserGameObject';
import GameUserModel from '../models/GameUser';
import * as Sessions from '../Sessions';
import AreaRoutes from './AreaRoutes';

export default (socket: SocketIO.Socket) => {
  const me: AreaUserGameObject = socket['user'];
  socket['user'] = undefined;

  me.send.init({
    zones: [me.zone.serialize()],
    objects: me.zone.objects.map(object => object.serialize()),
  });

  const routes = new AreaRoutes(me, socket);

  socket.on('disconnect', async () => {
    routes.destroy();

    Sessions.logout(me.id);
    me.zone.removeUser(me);

    try {
      await GameUserModel.findByIdAndUpdate(me.id, {
        'loc.pos.x': me.position.x,
        'loc.pos.y': me.position.y,
        'loc.pos.z': me.position.z,
        'loc.dir.x': me.direction.x,
        'loc.dir.y': me.direction.y,
        'loc.dir.z': me.direction.z,
      }).exec();
    } catch(err) {
      console.error(err);
    }
  });
};
