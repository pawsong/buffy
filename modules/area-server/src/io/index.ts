import * as cookie from 'cookie';
import * as jwt from 'jsonwebtoken';
import * as Promise from 'bluebird';
import * as mongoose from 'mongoose';
import * as conf from '@pasta/config';
import ServerGameMap from '@pasta/core/lib/packet/ServerGameMap';
import AreaUserGameObject from '../classes/AreaUserGameObject';
import GameMapModel from '../models/GameMap';
import GameUserModel from '../models/GameUser';
import TerrainModel from '../models/Terrain';
import MeshModel from '../models/Mesh';
import { MeshDocument } from '../models/Mesh';
import * as GameMapManager from '../GameMapManager';
import routes from './routes';
import * as Sessions from '../Sessions';
import * as TWEEN from '@pasta/tween.js';

import AreaRoutes from './AreaRoutes';

async function findOrCreateUser(userId: string) {
  const userDoc = await GameUserModel.findOne({ owner: userId }).exec();
  if (userDoc) { return userDoc; }
  return await GameUserModel.create({ owner: userId });
}

export default (io: SocketIO.Server) => {
  io.use(async function (socket, next) {
    try {
      const cookies = cookie.parse(socket.request.headers.cookie);
      const token = cookies['tt'];

      const decoded = await new Promise<{id: string}>((resolve, reject) => {
        jwt.verify(token, conf.jwtSecret, (err, decoded) => {
          err ? reject(err) : resolve(decoded);
        });
      });

      const userId = decoded.id;
      const userDoc = await findOrCreateUser(userId);

      if (!userDoc.home) {
        const home = await GameMapModel.create({
          name: `${userId}'s home`,
          width: 10,
          depth: 10,
        });
        userDoc.home = home._id;
        await userDoc.save();
      }

      if (!userDoc.loc || !userDoc.loc.map) {
        userDoc.loc = {
          map: userDoc.home,
          pos: {
            x: 1,
            y: 0,
            z: 1,
          },
          dir: {
            x: 0,
            y: 0,
            z: 1,
          }
        };
        await userDoc.save();
      }

      const mapId = (userDoc.loc.map as mongoose.Types.ObjectId).toHexString();
      const zone = await GameMapManager.findOrCreate(mapId);

      let mesh: MeshDocument;

      // Prevent duplicate session.
      Sessions.login(userId, socket);

      const user = new AreaUserGameObject({
        id: userDoc.id,
        robot: userDoc.robot,
        zone: zone.id,
        designId: userDoc.designId,
        position: {
          x: userDoc.loc.pos.x,
          y: userDoc.loc.pos.y || 0,
          z: userDoc.loc.pos.z,
        },
        direction: userDoc.loc.dir || { x: 0, y: 0, z: 1 },
      }, zone, socket);
      zone.addUser(user);

      socket['user'] = user;
      next();
    } catch(err) {
      console.error(err.stack || err);
      next(err);
    }
  });

  /*
   * Map enter process:
   *
   * 1. If map instance exists in this area server, enter.
   *    If not, continue to step 2.
   * 2. If map instance exists in other area server,
   *    redirect client to found area server. If not, continue to step 3.
   * 3. Map is not instantiated now. Request instantiation and
   *    transfer client to area server that contains new map instance.
   */
  io.on('connection', routes);
}
