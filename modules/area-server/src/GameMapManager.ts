import * as _ from 'lodash';
import ServerGameMap from '@pasta/core/lib/packet/ServerGameMap';
import GameMapModel from './models/GameMap';
import TerrainModel from './models/Terrain';

const gameMaps: ServerGameMap[] = [];

export function add(map: ServerGameMap) {
  gameMaps.push(map);
}

export function find(mapId: string): ServerGameMap {
  return _.find(gameMaps, { id: mapId });
}

export async function findOrCreate(mapId: string): Promise<ServerGameMap> {
  let map = find(mapId);
  if (map) { return map; }

  // TODO: Request coordinator to choose free area server and
  // new spawn map instance.
  const mapDoc = await GameMapModel.findById(mapId).exec();
  if (!mapDoc) {
    // Error. Cannot find map
    throw new Error(`Cannot find map ${mapId}`);
  }

  const terrains = await TerrainModel.find({ map: mapDoc._id }).exec();
  map = find(mapId);
  if (map) { return map; }

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

  add(map);
  return map;
}

// Update loop
// TODO: Static 20fps, is this OK?
let oldTime = Date.now();
function update() {
  const now = Date.now();
  const dt = now - oldTime;
  gameMaps.forEach(map => map.update(dt));
  oldTime = now;
  setTimeout(update, 1000 / 20);
}
update();
