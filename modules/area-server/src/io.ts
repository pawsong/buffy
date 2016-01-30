import * as cookie from 'cookie';
import * as jwt from 'jsonwebtoken';
import * as Promise from 'bluebird';
import * as conf from '@pasta/config';
import ServerGameMap from './classes/ServerGameMap';
import GameUser from './classes/GameUser';
import GameMapModel from './models/GameMap';
import GameUserModel from './models/GameUser';
import TerrainModel from './models/Terrain';
import MeshModel from './models/Mesh';
import { MeshDocument } from './models/Mesh';
import * as GameMapManager from './GameMapManager';
import routes from './routes';
import * as Sessions from './Sessions';
import * as TWEEN from '@pasta/tween.js';

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
            z: 1,
          }
        };
        await userDoc.save();
      }

      const mapId = userDoc.loc.map.toHexString();
      let map = GameMapManager.find(mapId);
      if (!map) {
        // TODO: Request coordinator to choose free area server and
        // new spawn map instance.
        const mapDoc = await GameMapModel.findById(mapId).exec();
        if (!mapDoc) {
          // Error. Cannot find map
          throw new Error(`Cannot find map ${mapId}`);
        }

        const terrains = await TerrainModel.find({ map: mapDoc._id }).exec();

        map = new ServerGameMap({
          id: mapDoc.id,
          name: mapDoc.name,
          width: mapDoc.width,
          depth: mapDoc.depth,
          terrains: terrains.map(terrain => ({
            id: terrain.id,
            position: {
              x: terrain.loc.x,
              z: terrain.loc.z,
            },
            color: terrain.color,
          })),
          objects: [], // TODO: Load objects
        });

        GameMapManager.add(map);
      }

      let mesh: MeshDocument;
      if (userDoc.mesh) {
        mesh = await MeshModel.findById(userDoc.mesh.toHexString()).exec();
      }

      const user = new GameUser(socket, userId, {
        id: userDoc.id,
        position: {
          x: userDoc.loc.pos.x,
          z: userDoc.loc.pos.z,
        },
        mesh: mesh ? {
          id: mesh.id,
          vertices: mesh.vertices,
          faces: mesh.faces,
        } : null,
      });

      // Prevent duplicate session.
      Sessions.login(userId, socket);
      map.addUser(user);
      user.map = map;

      socket['user'] = user;

      next();
    } catch(err) {
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
